const energyData = {
  gridStatus: 'Online',
  batteryLevel: 87,
  energyConsumption: 2.3,
  consumptionHistory: [1.5, 1.8, 2.1, 2.3, 2.2, 2.5, 2.4],
  solarGeneration: 1.2,
  gridPrice: 0.15,
  appliances: [
    { id: 1, name: 'Air Conditioner', isOn: true },
    { id: 2, name: 'Washing Machine', isOn: false },
    { id: 3, name: 'Dishwasher', isOn: true },
    { id: 4, name: 'EV Charger', isOn: false },
  ],
};

export const getEnergyData = () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate data fluctuations
      energyData.batteryLevel = Math.max(0, Math.min(100, energyData.batteryLevel + (Math.random() - 0.5) * 2));
      energyData.energyConsumption = Math.max(1, energyData.energyConsumption + (Math.random() - 0.5) * 0.5);
      energyData.solarGeneration = Math.max(0, energyData.solarGeneration + (Math.random() - 0.5) * 0.3);
      energyData.gridPrice = Math.max(0.1, energyData.gridPrice + (Math.random() - 0.5) * 0.05);
      energyData.consumptionHistory.push(energyData.energyConsumption);
      if (energyData.consumptionHistory.length > 10) {
        energyData.consumptionHistory.shift();
      }
      resolve({
        gridStatus: energyData.gridStatus,
        batteryLevel: Math.round(energyData.batteryLevel),
        energyConsumption: Math.round(energyData.energyConsumption * 10) / 10,
        consumptionHistory: energyData.consumptionHistory.map(c => Math.round(c * 10) / 10),
        solarGeneration: Math.round(energyData.solarGeneration * 10) / 10,
        gridPrice: Math.round(energyData.gridPrice * 100) / 100,
        appliances: energyData.appliances,
      });
    }, 1000);
  });
};

export const toggleAppliance = (applianceId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const appliance = energyData.appliances.find(a => a.id === applianceId);
      if (appliance) {
        appliance.isOn = !appliance.isOn;
      }
      resolve(appliance);
    }, 500);
  });
};
