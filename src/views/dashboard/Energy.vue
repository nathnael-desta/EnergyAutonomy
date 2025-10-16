<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy Dashboard</h1>

    <!-- Temporary verification panel -->
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Airtable ↔ Dashboard check</h2>
        <button
          class="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          @click="loading=true; fetchDecisions(32).then(r => decisions.value = r).catch(e => error.value = e?.message || String(e)).finally(()=>loading=false)"
        >
          Refresh
        </button>
      </div>

      <div v-if="loading" class="mt-3 text-gray-500">Loading…</div>
      <div v-else-if="error" class="mt-3 text-red-600">Error: {{ error }}</div>

      <div v-else class="mt-4 space-y-2">
        <div v-if="latest" class="text-sm">
          <div><b>Latest:</b> {{ new Date(latest.time_iso).toLocaleString() }}</div>
          <div><b>Action:</b> {{ latest.action }}</div>
          <div><b>Why:</b> {{ latest.rationale }}</div>
          <div class="flex gap-4 mt-1 text-gray-600">
            <span>Price: €{{ (latest.price_eur_kwh ?? 0).toFixed(5) }}/kWh</span>
            <span>Irr: {{ latest.irradiance_wm2 ?? '—' }} W/m²</span>
            <span>Trend: {{ latest.cost_trend }}</span>
            <span>Stress: {{ latest.grid_stress }}</span>
          </div>
        </div>
        <div v-else class="text-gray-500">No records found.</div>
      </div>
    </div>

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
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import DataCard from '@/components/DataCard.vue'
import EnergyChart from '@/components/EnergyChart.vue'
import ApplianceControl from '@/components/ApplianceControl.vue'
import { getEnergyData, toggleAppliance } from '@/services/energyService.js'
import { fetchDecisions } from '@/services/airtable.js';

export default {
  name: 'EnergyDashboard',
  components: {
    DataCard,
    EnergyChart,
    ApplianceControl,
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

    onMounted(async () => {
      fetchData();
      setInterval(fetchData, 5000); // Refresh every 5 seconds

      try {
        decisions.value = await fetchDecisions(32); // smaller initial load
      } catch (e) {
        error.value = e?.message || String(e);
      } finally {
        loading.value = false;
      }
    });

    const latest = computed(() => decisions.value?.[0] || null);

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
      fetchDecisions,
    };
  }
}
</script>