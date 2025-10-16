<template>
  <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appliance Control</h3>
    <ul>
      <li v-for="appliance in appliances" :key="appliance.id" class="flex items-center justify-between py-2">
        <span class="text-gray-800 dark:text-gray-200">{{ appliance.name }}</span>
        <button
          @click="$emit('toggle', appliance.id)"
          :class="appliance.isOn ? 'bg-green-500' : 'bg-red-500'"
          class="px-4 py-2 text-white font-semibold rounded-lg"
        >
          {{ appliance.isOn ? 'On' : 'Off' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ApplianceControl',
  props: {
    appliances: {
      type: Array,
      required: true,
    },
  },
  emits: ['toggle'],
}
</script>
