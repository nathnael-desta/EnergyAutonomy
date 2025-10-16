// src/services/airtable.js
const API_KEY   = import.meta.env.VITE_AIRTABLE_API_KEY;
const BASE_ID   = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE     = import.meta.env.VITE_AIRTABLE_TABLE || 'Decisions';

if (!API_KEY || !BASE_ID) {
  // Helpful runtime hint while developing
  console.warn('⚠️ Missing Airtable env vars (VITE_AIRTABLE_API_KEY / VITE_AIRTABLE_BASE_ID).');
}

/**
 * Fetch latest decision rows from Airtable and map to a clean shape.
 * @param {number} limit how many rows (default 96)
 * @returns {Promise<Array<{time_iso:string,action:string,rationale:string,price_eur_kwh:number|null,avg_next_60min_price_eur_kwh:number|null,irradiance_wm2:number|null,avg_next_60min_irradiance_wm2:number|null,cost_trend:string,grid_stress:string}>>}
 */
export async function fetchDecisions(limit = 96) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`);
  // Sort newest first by your Airtable field (make sure the field is named "time_iso" or adjust below)
  url.searchParams.set('sort[0][field]', 'time_iso');
  url.searchParams.set('sort[0][direction]', 'desc');
  url.searchParams.set('maxRecords', String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Airtable HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Map Airtable records -> flat objects expected by the dashboard
  const out = (data.records || []).map(r => {
    const f = r.fields || {};
    return {
      time_iso: f.time_iso ?? null,
      action: f.action ?? '',
      rationale: f.rationale ?? '',
      price_eur_kwh: numOrNull(f.price_eur_kwh),
      avg_next_60min_price_eur_kwh: numOrNull(f.avg_next_60min_price_eur_kwh),
      irradiance_wm2: numOrNull(f.irradiance_wm2),
      avg_next_60min_irradiance_wm2: numOrNull(f.avg_next_60min_irradiance_wm2),
      cost_trend: f.cost_trend ?? 'Stable',
      grid_stress: f.grid_stress ?? 'Medium',
    };
  });

  return out;
}

function numOrNull(v) {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}
