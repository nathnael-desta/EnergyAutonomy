<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy Dashboard</h1>

    <!-- Error / Loading -->
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <div v-if="loading && !latest" class="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
      Loading latest decision…
    </div>

    <!-- Decision card -->
    <DecisionCard v-if="latest" :record="latest" :loading="loading" />

    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <DataCard title="Grid Status" :value="gridStatus" subtitle="Connected to the main grid" />
      <DataCard title="Battery Level" :value="batteryLevel + '%'" subtitle="Charged" />
      <DataCard title="Energy Consumption" :value="energyConsumption + ' kWh'" subtitle="Last hour" />
      <DataCard title="Solar Generation" :value="solarGeneration + ' kWh'" subtitle="Current production" />
      <DataCard title="Grid Price" :value="'$' + gridPrice" subtitle="per kWh" />
    </div>
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
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Price vs Solar (last 96 records)</h2>
        <button
          class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
          @click="load"
          :disabled="loading"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>

      <apexchart
        v-if="priceSolarSeries[0].data.length || priceSolarSeries[1].data.length"
        type="line"
        height="340"
        :options="priceSolarOptions"
        :series="priceSolarSeries"
      />
      <div v-else class="text-sm text-gray-500">No chartable data yet.</div>
    </div>

    <!-- NEW: Actions Over Time chart -->
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Actions Over Time -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Actions Over Time</h2>
          <button
            class="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
            @click="load"
            :disabled="loading"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
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
import { ref, onMounted, computed } from 'vue'
import DataCard from '@/components/DataCard.vue'
import EnergyChart from '@/components/EnergyChart.vue'
import ApplianceControl from '@/components/ApplianceControl.vue'
import DecisionCard from '@/components/DecisionCard.vue'
import RecentDecisionsTable from '@/components/RecentDecisionsTable.vue'
import { getEnergyData, toggleAppliance } from '@/services/energyService';
import { fetchDecisions } from '@/services/airtable';

export default {
  name: 'EnergyDashboard',
  components: {
    DataCard,
    EnergyChart,
    ApplianceControl,
    DecisionCard,
    RecentDecisionsTable,
  },
  setup() {
    const gridStatus = ref('Offline');
    const batteryLevel = ref(0);
    const energyConsumption = ref(0);
    const consumptionHistory = ref([]);
    const solarGeneration = ref(0);
    const gridPrice = ref(0);
    const appliances = ref([]);

    const loading = ref(true);
    const error = ref('');
    const decisions = ref([]);

    const chartData = computed(() => ({
      labels: consumptionHistory.value.map((_, i) => `T-${consumptionHistory.value.length - i - 1}`),
      datasets: [
        {
          label: 'Energy Consumption (kWh)',
          backgroundColor: '#f87979',
          data: consumptionHistory.value,
        },
      ],
    }));

    const fetchData = async () => {
      const data = await getEnergyData();
      gridStatus.value = data.gridStatus;
      batteryLevel.value = data.batteryLevel;
      energyConsumption.value = data.energyConsumption;
      consumptionHistory.value = data.consumptionHistory;
      solarGeneration.value = data.solarGeneration;
      gridPrice.value = data.gridPrice;
      appliances.value = data.appliances;
    };

    const handleToggleAppliance = async (applianceId) => {
      await toggleAppliance(applianceId);
      await fetchData();
    };

    async function load() {
      loading.value = true;
      error.value = '';
      try {
        decisions.value = await fetchDecisions(96);
      } catch (e) {
        error.value = e?.message || String(e);
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      fetchData();
      setInterval(fetchData, 5000); // Refresh every 5 seconds
      load();
    });

    const latest = computed(() => decisions.value?.[0] || null);

    // --- NEW: build series in chronological order (oldest -> newest)
    const chronological = computed(() => {
      // decisions[0] is newest (sorted desc). Reverse for time-ascending charts.
      return [...(decisions.value || [])].reverse()
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

    return {
      gridStatus,
      batteryLevel,
      energyConsumption,
      solarGeneration,
      gridPrice,
      appliances,
      chartData,
      handleToggleAppliance,
      loading,
      error,
      decisions,
      latest,
      load,
      priceSolarSeries,
      priceSolarOptions,

      actionSeries,
      actionOptions,
    };
  }
}
</script>