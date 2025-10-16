<!-- src/components/RecentDecisionsTable.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },   // array of decisions (newest first)
  limit: { type: Number, default: 20 },        // show top N
})

const rows = computed(() => (props.items || []).slice(0, props.limit))

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString() } catch { return iso ?? '—' }
}
function fmtPrice(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '—'
  return `€${Number(x).toFixed(5)}/kWh`
}
function fmtIrr(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '—'
  return `${Math.round(Number(x))} W/m²`
}
function stressBadge(stress) {
  switch (stress) {
    case 'Low':    return 'bg-green-100 text-green-800 ring-1 ring-green-200'
    case 'High':   return 'bg-red-100 text-red-800 ring-1 ring-red-200'
    default:       return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-base font-semibold">Recent Decisions</h2>
      <div class="text-xs text-gray-500">Showing {{ rows.length }} most recent</div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse">
        <thead>
          <tr class="bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <th class="px-3 py-2">Time</th>
            <th class="px-3 py-2">Action</th>
            <th class="px-3 py-2">Price</th>
            <th class="px-3 py-2">Irradiance</th>
            <th class="px-3 py-2">Trend</th>
            <th class="px-3 py-2">Stress</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.time_iso" class="border-t text-sm">
            <td class="px-3 py-2 whitespace-nowrap text-gray-700">{{ fmtTime(r.time_iso) }}</td>
            <td class="px-3 py-2 text-gray-900 font-medium">{{ r.action || '—' }}</td>
            <td class="px-3 py-2 text-gray-700">{{ fmtPrice(r.price_eur_kwh) }}</td>
            <td class="px-3 py-2 text-gray-700">{{ fmtIrr(r.irradiance_wm2) }}</td>
            <td class="px-3 py-2 text-gray-700">{{ r.cost_trend || '—' }}</td>
            <td class="px-3 py-2">
              <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold', stressBadge(r.grid_stress)]">
                {{ r.grid_stress || '—' }}
              </span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="px-3 py-6 text-center text-sm text-gray-500">No decisions yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
