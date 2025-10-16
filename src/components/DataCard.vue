<template>
  <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
    <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
    <p class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
  </div>
</template>

<script>
export default {
  name: 'DataCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
  },
}
</script>
