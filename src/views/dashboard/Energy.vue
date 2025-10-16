<template>
  <!-- add left margin on large screens so content sits to the right of the fixed sidebar -->
  <div class="p-4 sm:p-6 lg:ml-64">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ VIEW_LABEL }}</h1>
      <button
        class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        @click="refresh"
        :disabled="loading"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-6 rounded-lg bg-red-100 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Local Energy Data -->
    <div v-if="loadingLocal" class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
      Loading local energy data…
    </div>

    <div v-else-if="localEnergy" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <DataCard title="Grid Status" :value="localEnergy.gridStatus" subtitle="Connected to the main grid" />
      <DataCard title="Battery Level" :value="localEnergy.batteryLevel + '%'" subtitle="Charged" />
      <DataCard title="Energy Consumption" :value="localEnergy.energyConsumption + ' kWh'" subtitle="Last hour" />
      <DataCard title="Solar Generation" :value="localEnergy.solarGeneration + ' kWh'" subtitle="Current production" />
      <DataCard title="Grid Price" :value="'$' + localEnergy.gridPrice" subtitle="per kWh" />
    </div>

    <!-- Decision card -->
    <DecisionCard v-if="latest" :record="latest" :loading="loading" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy Consumption</h2>
        <EnergyChart :chartData="chartData" />
      </div>
      <div>
        <ApplianceControl :appliances="appliances" @toggle="handleToggleAppliance" />
      </div>
    </div>

    <!-- NEW: Price vs Solar chart -->
    <div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Price vs Solar -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Price vs Solar</h2>
        </div>

        <apexchart
          v-if="priceSolarSeries.some(s => s.data.length)"
          type="line"
          height="340"
          :options="priceSolarOptions"
          :series="priceSolarSeries"
        />
        <div v-else class="text-sm text-gray-500">No solar or price data yet.</div>
      </div>

      <!-- Actions Over Time -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Actions Over Time</h2>
        </div>

        <apexchart
          v-if="actionSeries.some(s => s.data.length)"
          type="scatter"
          height="280"
          :options="actionOptions"
          :series="actionSeries"
        />
        <div v-else class="text-sm text-gray-500">No action history yet.</div>
      </div>
    </div>

    <!-- Recent Decisions table -->
    <div class="mt-8">
      <RecentDecisionsTable :items="decisions" :limit="20" />
    </div>

    <!-- Bottom Row -->
    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Additional content can go here -->
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getEnergyData, toggleAppliance } from '@/services/energyService';
import { fetchDecisions } from '@/services/airtable';
import DecisionCard from '@/components/DecisionCard.vue';
import RecentDecisionsTable from '@/components/RecentDecisionsTable.vue';
import DataCard from '@/components/DataCard.vue';
import ApplianceControl from '@/components/ApplianceControl.vue';

const VIEW_LABEL = 'Energy';

export default {
  name: 'EnergyDashboard',
  components: {
    DecisionCard,
    RecentDecisionsTable,
    DataCard,
    ApplianceControl,
  },
  setup() {
    // ----- Local Energy State -----
    const localEnergy = ref(null);
    const loadingLocal = ref(false);
    const errorLocal = ref(null);

    async function loadLocalEnergy() {
      loadingLocal.value = true;
      errorLocal.value = null;
      try {
        const data = await getEnergyData();
        localEnergy.value = data;
      } catch (e) {
        errorLocal.value = e.message;
      } finally {
        loadingLocal.value = false;
      }
    }

    function handleToggleAppliance(appliance) {
      toggleAppliance(appliance.id)
        .then(() => {
          // Optimistically update local state
          appliance.enabled = !appliance.enabled;
        })
        .catch(e => {
          errorLocal.value = `Failed to toggle ${appliance.name}: ${e.message}`;
        });
    }

    // ----- Decision State (Airtable) -----
    const decisions = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function loadDecisions() {
      loading.value = true;
      error.value = null;
      try {
        // fetch last 50 for chart density
        decisions.value = await fetchDecisions(50);
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    // ----- Combined Refresh -----
    async function refresh() {
      await Promise.all([loadDecisions(), loadLocalEnergy()]);
    }

    // ----- Computed Properties -----
    const latest = computed(() => decisions.value?.[0] || null);

    const chartData = computed(() => ({
      labels: localEnergy.value?.consumptionHistory.map((_, i) => `T-${localEnergy.value.consumptionHistory.length - i - 1}`) || [],
      datasets: [
        {
          label: 'Energy Consumption (kWh)',
          backgroundColor: '#f87979',
          data: localEnergy.value?.consumptionHistory || [],
        },
      ],
    }));

    const chronological = computed(() => {
      // reverse a copy
      return [...(decisions.value || [])].reverse();
    })

    const pricePoints = computed(() =>
      chronological.value
        .filter(r => Number.isFinite(Number(r.price_eur_kwh)) && r.time_iso)
        .map(r => [new Date(r.time_iso).getTime(), Number(r.price_eur_kwh)])
    )

    const irrPoints = computed(() =>
      chronological.value
        .filter(r => r.time_iso && (r.irradiance_wm2 === 0 || Number.isFinite(Number(r.irradiance_wm2))))
        .map(r => [new Date(r.time_iso).getTime(), Number(r.irradiance_wm2 ?? 0)])
    )

    const priceSolarSeries = computed(() => ([
      { name: 'Price (€/kWh)', type: 'line', data: pricePoints.value },
      { name: 'Irradiance (W/m²)', type: 'line', data: irrPoints.value },
    ]))

    const priceSolarOptions = computed(() => ({
      chart: { type: 'line', toolbar: { show: false } },
      stroke: { width: [2, 2], curve: 'smooth' },
      colors: ['#2563eb', '#f59e0b'], // optional: blue price, amber irradiance
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: false }, // show in local time
      },
      yaxis: [
        {
          title: { text: '€/kWh' },
          decimalsInFloat: 5,
        },
        {
          opposite: true,
          title: { text: 'W/m²' },
        },
      ],
      tooltip: {
        shared: true,
        x: { format: 'yyyy-MM-dd HH:mm' },
      },
      legend: { show: true },
      noData: { text: 'No data' },
    }))

    // ----- Actions Over Time (scatter lanes) -----
    const ACTION_META = [
      { key: 'DISCHARGE_BATTERY_TO_SUPPLY_LOAD', label: 'Discharge to Load', y: 5, color: '#ef4444' }, // red
      { key: 'CHARGE_BATTERY_FROM_GRID',         label: 'Charge from Grid',  y: 4, color: '#3b82f6' }, // blue
      { key: 'USE_GRID_NORMALLY',                label: 'Use Grid Normally', y: 3, color: '#64748b' }, // slate
      { key: 'PRIORITIZE_LOCAL_GENERATION',      label: 'Prioritize Local Gen', y: 2, color: '#22c55e' }, // green
      { key: 'EXPORT_EXCESS_TO_GRID',            label: 'Export to Grid',    y: 1, color: '#f59e0b' }, // amber
    ];

    // map action key -> meta for quick lookup
    const actionIndexByKey = ACTION_META.reduce((m, a) => (m[a.key] = a, m), {});

    const actionSeries = computed(() => {
      // Build one scatter series per action, placing points on its lane (constant y)
      return ACTION_META.map(meta => {
        const pts = (chronological.value || [])
          .filter(r => r.action === meta.key && r.time_iso)
          .map(r => [ new Date(r.time_iso).getTime(), meta.y ]);
        return { name: meta.label, data: pts };
      });
    });

    const actionOptions = computed(() => ({
      chart: { type: 'scatter', toolbar: { show: false } },
      markers: { size: 5, strokeWidth: 0 },
      colors: ACTION_META.map(a => a.color),
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: false },
        tooltip: { enabled: true },
      },
      yaxis: {
        min: 0, max: 6, tickAmount: 5,
        labels: {
          formatter: (val) => {
            const lane = Math.round(val);
            const found = ACTION_META.find(a => a.y === lane);
            return found ? found.label : '';
          }
        }
      },
      tooltip: {
        shared: false,
        x: { format: 'yyyy-MM-dd HH:mm' },
        y: {
          formatter: (val, opts) => {
            // Show the action label in tooltip
            const seriesIdx = opts.seriesIndex;
            return ACTION_META[seriesIdx]?.label || '';
          }
        }
      },
      legend: { show: true },
      grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
      noData: { text: 'No actions to display' },
    }));


    // ----- Lifecycle & Auto-Refresh -----
    let refreshInterval = null;
    onMounted(() => {
      refresh();
      refreshInterval = setInterval(refresh, 10 * 60 * 1000); // 10 minutes
    });
    onUnmounted(() => {
      clearInterval(refreshInterval);
    });

    // ----- Exports for template -----
    return {
      VIEW_LABEL,

      // local energy
      localEnergy,
      loadingLocal,
      errorLocal,
      handleToggleAppliance,
      decisions,
      loading,
      error,
      refresh,
      latest,

      // charts
      priceSolarSeries,
      priceSolarOptions,

      actionSeries,
      actionOptions,
    };
  },
};
</script>