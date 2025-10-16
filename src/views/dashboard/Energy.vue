<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy Dashboard</h1>
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

    onMounted(() => {
      fetchData();
      setInterval(fetchData, 5000); // Refresh every 5 seconds
    });

    return {
      gridStatus,
      batteryLevel,
      energyConsumption,
      solarGeneration,
      gridPrice,
      appliances,
      chartData,
      handleToggleAppliance,
    };
  }
}
</script>