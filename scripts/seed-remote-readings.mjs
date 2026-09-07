// One-off script to POST dummy readings to a deployed geomine backend.
// Usage:  node scripts/seed-remote-readings.mjs
// Auth:   env vars BACKEND_URL, AUTH_TOKEN (Bearer JWT), or pass via --token.
// Idempotency: NO. It will post again on every run.

const BACKEND_URL = process.env.BACKEND_URL || "https://geomine-backend-api-backend.onrender.com";
const TOKEN = process.env.AUTH_TOKEN;
if (!TOKEN) { console.error("Set AUTH_TOKEN env var"); process.exit(1); }

// Discovered from the running backend (2026-09-07).
const MACHINES = [
  { id: "5f03b9dc-94a3-4c12-8b3e-aca941592eff", name: "D",        faulting: false },
  { id: "dd644018-ddda-4bbc-adad-383545eafc2a", name: "Gen A #1", faulting: true  },
  { id: "6cb7a6dd-1d52-4000-bd6f-a180806f4d26", name: "Gen A #2", faulting: false },
  { id: "558d3dcd-98c5-4c43-a80c-dd67bbebe4b3", name: "Gen A #3", faulting: false },
];

// Active parameters (id, key) discovered from /api/parameters.
const PARAMS = {
  output_current:   "1bae0b75-c356-4d08-ae17-3235829baa7b",
  voltage:          "58fa2daf-5b0f-457c-9d7a-9a05008c918e",
  speed_rpm:        "ed59e0ea-1b0b-4f4d-b1f9-e629bb900de5",
  bearing_temp:     "b382c713-b2cf-4d92-8d6f-a36b828f9629",
  power_factor:     "4d44d88b-0d77-4a9c-a070-74e5f966637f",
  engine_hours:     "3c2064b5-22b9-4cbd-b2ca-721a1661f2b1",
  fuel_level:       "383cadc8-18c3-401d-9f21-6df9e010530b",
  oil_pressure:     "348eae57-46d8-4f4e-92b5-9abf1f691bcc",
  coolant_temp:     "796262fa-5b49-4f76-bf6a-f452944fa110",
  battery_voltage:  "19d19a10-159b-401b-ba02-d2673b20eb00",
  kw_output:        "393126b5-6a7e-4e66-8a45-9165b729e374",
  kwh_cumulative:   "5aa43507-8c29-4f5a-8c7b-6b80d81fda54",
};

const DAYS = 60;
const DAYS_AGO_START = 60;

// Random number in [a, b).
function rand(a, b) { return a + Math.random() * (b - a); }
function round(n, dp = 2) { const m = Math.pow(10, dp); return Math.round(n * m) / m; }

// Realistic baseline values for a healthy generator.
function baseValues(dayIndex /* 0 = today, larger = older */, machineIdx) {
  // Each machine has a slight base offset so the fleet isn't identical.
  const mOff = (machineIdx * 0.3);
  return {
    output_current:  round(rand(60, 95) + mOff, 1),       // A
    voltage:         round(rand(380, 420), 1),             // V
    speed_rpm:       Math.round(rand(1480, 1520)),         // rpm
    bearing_temp:    round(rand(45, 65), 1),               // °C
    power_factor:    round(rand(0.85, 0.98), 3),           // -
    engine_hours:    Math.round(1200 + dayIndex * 6 + machineIdx * 17), // hr (cumulative, increasing)
    fuel_level:      round(rand(60, 170), 1),              // L
    oil_pressure:    round(rand(3.5, 5.0), 2),             // bar
    coolant_temp:    round(rand(70, 88), 1),               // °C
    battery_voltage: round(rand(12.4, 13.8), 2),           // V
    kw_output:       round(rand(40, 80), 1),               // kW
    kwh_cumulative:  Math.round(8000 + dayIndex * 120 + machineIdx * 240), // kWh (cumulative, increasing)
  };
}

// Drift-to-fault overlays. dayIndex=0 is the most recent (today).
function applyFaults(values, dayIndex) {
  // bearing_temp drifts up: was 55, now 92. Oil pressure drifts down: was 4.2, now 1.8.
  const drift = 1 - (dayIndex / DAYS); // 0 at the oldest, ~1 at the most recent
  values.bearing_temp = round(55 + (92 - 55) * drift + rand(-1.5, 1.5), 1);
  values.oil_pressure = round(4.2 - (4.2 - 1.8) * drift + rand(-0.1, 0.1), 2);
  // Some vibration in coolant temp at the end too.
  if (drift > 0.6) values.coolant_temp = round(values.coolant_temp + (drift - 0.6) * 15, 1);
  return values;
}

async function postReading(machineId, recordedAt, values) {
  const entries = Object.entries(values).map(([k, v]) => ({
    parameterId: PARAMS[k],
    value: v,
  }));
  const body = { machineId, recordedAt, entries };
  const res = await fetch(`${BACKEND_URL}/api/readings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`Seeding readings to ${BACKEND_URL}`);
  console.log(`Machines: ${MACHINES.length}, Days: ${DAYS}, Total batches: ${MACHINES.length * DAYS}`);

  let totalReadings = 0;
  let totalBatches = 0;
  const t0 = Date.now();

  for (let mIdx = 0; mIdx < MACHINES.length; mIdx++) {
    const machine = MACHINES[mIdx];
    console.log(`\n--- ${machine.name} (${machine.id}) ${machine.faulting ? "[FAULTING]" : "[healthy]"} ---`);

    for (let d = DAYS_AGO_START - 1; d >= 0; d--) {
      const recordedAt = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
      let values = baseValues(d, mIdx);
      if (machine.faulting) values = applyFaults(values, d);

      try {
        const out = await postReading(machine.id, recordedAt, values);
        totalReadings += out.readings?.length ?? 0;
        totalBatches++;
        if (totalBatches % 10 === 0) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(`  ... ${totalBatches}/${MACHINES.length * DAYS} batches posted (${elapsed}s, ${totalReadings} readings)`);
        }
        // Throttle: ~3 req/s. Render free tier is sensitive to bursts.
        await sleep(120);
      } catch (e) {
        console.error(`  ✗ ${machine.name} @ ${recordedAt}: ${e.message}`);
        await sleep(500);
      }
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDONE: ${totalBatches} batches, ${totalReadings} readings, ${elapsed}s`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
