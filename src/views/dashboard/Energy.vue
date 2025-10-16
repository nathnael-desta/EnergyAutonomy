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

    <!-- (We’ll add charts below in the next step) -->
    <div class="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
      Charts placeholder — we’ll wire Price vs Solar next.
      <button
        class="ml-3 rounded-md bg-gray-900 px-3 py-1.5 text-white"
        @click="load"
        :disabled="loading"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import DataCard from '@/components/DataCard.vue'
import EnergyChart from '@/components/EnergyChart.vue'
import ApplianceControl from '@/components/ApplianceControl.vue'
import DecisionCard from '@/components/DecisionCard.vue'
import { getEnergyData, toggleAppliance } from '@/services/energyService.js'
import { fetchDecisions } from '@/services/airtable.js';

export default {
  name: 'EnergyDashboard',
  components: {
    DataCard,
    EnergyChart,
    ApplianceControl,
    DecisionCard,
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
    };
  }
}
</script>