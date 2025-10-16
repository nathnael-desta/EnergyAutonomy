<!-- src/components/DecisionCard.vue -->
<script setup>
import { computed } from 'vue';

/**
 * Props: a single decision record (latest)
 * {
 *  time_iso, action, rationale,
 *  price_eur_kwh, avg_next_60min_price_eur_kwh,
 *  irradiance_wm2, avg_next_60min_irradiance_wm2,
 *  cost_trend, grid_stress
 * }
 */
const props = defineProps({
  record: {
    type: Object,
    default: () => ({}),
  },
  // optional: show a refresh button in the card header
  loading: { type: Boolean, default: false },
});

const stressColor = computed(() => {
  switch (props.record?.grid_stress) {
    case 'Low': return 'bg-green-100 text-green-800 ring-1 ring-green-200';
    case 'High': return 'bg-red-100 text-red-800 ring-1 ring-red-200';
    default: return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200';
  }
});

const trendColor = computed(() => {
  switch (props.record?.cost_trend) {
    case 'Rising':  return 'bg-rose-100 text-rose-800 ring-1 ring-rose-200';
    case 'Falling': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';
    default:        return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200';
  }
});

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso ?? '—'; }
}
function fmtPrice(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '—';
  return `€${Number(x).toFixed(5)}/kWh`;
}
function fmtIrr(x) {
  if (x === null || x === undefined || Number.isNaN(Number(x))) return '—';
  return `${Math.round(Number(x))} W/m²`;
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <!-- Header -->
    <div class="mb-2 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
          <!-- lightning icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
          </svg>
        </div>
        <div>
          <div class="text-base font-semibold">Latest Decision</div>
          <div class="text-xs text-gray-500">{{ fmtTime(record?.time_iso) }}</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span :class="['px-2.5 py-1 text-xs font-semibold rounded-full', stressColor]">
          Stress: {{ record?.grid_stress ?? '—' }}
        </span>
        <span :class="['px-2.5 py-1 text-xs font-semibold rounded-full', trendColor]">
          Trend: {{ record?.cost_trend ?? '—' }}
        </span>
      </div>
    </div>

    <!-- Action + rationale -->
    <div class="mb-3">
      <div class="text-lg font-semibold">
        {{ record?.action ?? '—' }}
      </div>
      <p class="mt-1 text-sm text-gray-600">
        {{ record?.rationale ?? '—' }}
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Price (now)</div>
        <div class="text-sm font-semibold">{{ fmtPrice(record?.price_eur_kwh) }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Avg Price (+60m)</div>
        <div class="text-sm font-semibold">{{ fmtPrice(record?.avg_next_60min_price_eur_kwh) }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Irradiance (now)</div>
        <div class="text-sm font-semibold">{{ fmtIrr(record?.irradiance_wm2) }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div class="text-xs text-gray-500">Avg Irr (+60m)</div>
        <div class="text-sm font-semibold">{{ fmtIrr(record?.avg_next_60min_irradiance_wm2) }}</div>
      </div>
    </div>
  </div>
</template>
