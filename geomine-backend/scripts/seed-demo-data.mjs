// Seeds realistic demo data across every machine/reading/refuel/fault field
// so the full app (dashboard, machine detail, recommendations, reports) has
// something real to show. Local/demo use only — not run automatically.
//
// Requires: database/full-neon-mvp.sql and
// database/0002_reconstructed_metrics_and_events.sql already applied, plus
// the three app_users rows this script assigns readings/events to
// (admin@example.com, johndoe@example.com, janedoe@example.com).
//
// Usage: node scripts/seed-demo-data.mjs

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const appRoot = process.cwd();
for (const f of [path.join(appRoot, ".env.local"), path.join(appRoot, ".env")]) {
  if (fs.existsSync(f)) dotenv.config({ path: f });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function daysAgo(n, hour = 9) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const users = await pool.query(
    `select id, email from app_users where email in ($1,$2,$3)`,
    ["admin@example.com", "johndoe@example.com", "janedoe@example.com"]
  );
  const byEmail = Object.fromEntries(users.rows.map((r) => [r.email, r.id]));
  const admin = byEmail["admin@example.com"];
  const john = byEmail["johndoe@example.com"];
  const jane = byEmail["janedoe@example.com"];
  if (!admin || !john || !jane) {
    throw new Error(
      "Expected app_users rows for admin@example.com, johndoe@example.com, janedoe@example.com — create them via signup first."
    );
  }
  const enterers = [admin, john, jane];

  const paramsRes = await pool.query(
    `select id, key from parameter_definitions where machine_type = 'generator'`
  );
  const paramId = Object.fromEntries(paramsRes.rows.map((r) => [r.key, r.id]));
  const requiredParams = [
    "output_current", "voltage", "speed_rpm", "bearing_temp", "power_factor",
    "coolant_temp", "fuel_level", "engine_hours",
  ];
  for (const k of requiredParams) {
    if (!paramId[k]) throw new Error(`Missing parameter_definitions row for '${k}' — run the 0002 reconstruction SQL first.`);
  }

  // ---- machine definitions -------------------------------------------
  // Each "profile" drives the value ranges below so the dashboard shows a
  // realistic spread: healthy, watch, needs_maintenance, insufficient_data,
  // decommissioned, and a fuel-consumption edge case.
  const machines = [
    { name: "Gen-01", location: "Site A", phase: "three_phase", status: "active", profile: "healthy" },
    { name: "Gen-02", location: "Site A", phase: "three_phase", status: "active", profile: "needs_maintenance" },
    { name: "Gen-03", location: "Site B", phase: "single_phase", status: "active", profile: "watch" },
    { name: "Gen-04", location: "Site B", phase: "three_phase", status: "maintenance", profile: "healthy" },
    { name: "Gen-05", location: "Site A", phase: "three_phase", status: "decommissioned", profile: "stale" },
    { name: "Gen-06", location: "Site B", phase: "single_phase", status: "active", profile: "fuel_anomaly" },
    { name: "Gen-07", location: "Site A", phase: "three_phase", status: "active", profile: "healthy" },
    { name: "Gen-08", location: "Site B", phase: "three_phase", status: "active", profile: "insufficient_data" },
  ];

  for (const m of machines) {
    const machineId = randomUUID();
    await pool.query(
      `insert into machines (id, name, machine_type, location, status, phase_type)
       values ($1, $2, 'generator', $3, $4, $5)`,
      [machineId, m.name, m.location, m.status, m.phase]
    );

    const ratedCurrent = 8 + Math.random() * 6; // 8-14 A
    const specs = {
      rated_current: ratedCurrent,
      poles: 4,
      rated_temp_normal: 70,
      rated_temp_max: 95,
    };
    for (const [key, value] of Object.entries(specs)) {
      await pool.query(
        `insert into machine_specs (machine_id, key, value) values ($1, $2, $3)
         on conflict (machine_id, key) do nothing`,
        [machineId, key, value]
      );
    }

    // ---- visit schedule per profile ----------------------------------
    let visitDays; // days-ago values, oldest first
    if (m.profile === "insufficient_data") {
      visitDays = [1, 0];
    } else if (m.profile === "stale") {
      visitDays = [40, 35, 30]; // nothing recent — decommissioned
    } else {
      visitDays = [14, 12, 10, 8, 6, 4, 2, 0];
    }

    let fuelLevel = 380 + Math.random() * 40; // start ~380-420 L
    let engineHours = 1000 + Math.random() * 500;
    let coolantBase = m.profile === "needs_maintenance" ? 88 : m.profile === "watch" ? 78 : 68;
    let bearingBase = m.profile === "needs_maintenance" ? 92 : m.profile === "watch" ? 80 : 68;
    let pf = 0.93;
    const pfDrift = m.profile === "watch" ? -0.012 : m.profile === "needs_maintenance" ? -0.02 : 0.002;

    for (let vi = 0; vi < visitDays.length; vi++) {
      const t = daysAgo(visitDays[vi], 8 + vi);
      const enteredBy = enterers[vi % enterers.length];
      const entryMethod = vi % 4 === 3 ? "sensor" : "manual";
      const hasGps = vi % 2 === 0;
      const lat = hasGps ? -1.286 + (Math.random() - 0.5) * 0.01 : null;
      const lon = hasGps ? 36.817 + (Math.random() - 0.5) * 0.01 : null;
      const acc = hasGps ? Math.round(5 + Math.random() * 15) : null;

      // load: mostly normal, occasional overload/idle spikes for variety
      let loadFactor = 0.55 + Math.random() * 0.35; // 55-90% of rated
      if (m.profile === "needs_maintenance" && vi >= visitDays.length - 2) loadFactor = 1.05 + Math.random() * 0.15; // overload near the end
      if (vi === 1 && m.profile === "healthy") loadFactor = 0.05; // one idle reading for variety

      const current = ratedCurrent * loadFactor;
      const voltage = m.phase === "three_phase" ? 400 + (Math.random() - 0.5) * 10 : 230 + (Math.random() - 0.5) * 6;
      const rpm = 1800 + (Math.random() - 0.5) * 20;
      bearingBase += (Math.random() - 0.45) * 1.5;
      coolantBase += (Math.random() - 0.45) * 1.2;
      pf = Math.min(0.98, Math.max(0.6, pf + pfDrift + (Math.random() - 0.5) * 0.01));
      engineHours += 3 + Math.random() * 3;

      // fuel: normal machines drop steadily then jump on a refuel (handled below);
      // the fuel_anomaly machine gets an unexplained rise.
      if (m.profile === "fuel_anomaly" && vi === visitDays.length - 1) {
        fuelLevel += 120; // rises far more than the small refuel logged below explains
      } else {
        fuelLevel -= 15 + Math.random() * 10;
      }
      fuelLevel = Math.max(20, fuelLevel);

      const readings = [
        { key: "output_current", value: current },
        { key: "voltage", value: voltage },
        { key: "speed_rpm", value: rpm },
        { key: "bearing_temp", value: bearingBase },
        { key: "power_factor", value: pf },
        { key: "coolant_temp", value: coolantBase },
        { key: "fuel_level", value: fuelLevel },
        { key: "engine_hours", value: engineHours },
      ];

      for (const r of readings) {
        await pool.query(
          `insert into readings
             (machine_id, parameter_id, value, recorded_at, entered_by, entry_method, notes, latitude, longitude, location_accuracy_m)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            machineId, paramId[r.key], Math.round(r.value * 100) / 100, t, enteredBy, entryMethod,
            vi === visitDays.length - 1 ? "Routine check" : null,
            lat, lon, acc,
          ]
        );
      }
    }

    // ---- refuel events --------------------------------------------------
    if (m.profile === "fuel_anomaly") {
      await pool.query(
        `insert into refuel_events (machine_id, liters_added, recorded_at, entered_by, notes)
         values ($1, $2, $3, $4, $5)`,
        [machineId, 40, daysAgo(1, 7), enterers[0], "Small top-up — does not explain the fuel_level rise seen in readings"]
      );
    } else if (m.profile !== "stale" && m.profile !== "insufficient_data") {
      const refuelCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < refuelCount; i++) {
        await pool.query(
          `insert into refuel_events (machine_id, liters_added, recorded_at, entered_by, notes)
           values ($1, $2, $3, $4, $5)`,
          [machineId, Math.round(80 + Math.random() * 60), daysAgo(9 - i * 4, 7), enterers[i % 3], null]
        );
      }
    }

    // ---- fault events -----------------------------------------------------
    if (m.profile === "needs_maintenance") {
      await pool.query(
        `insert into fault_events (machine_id, code, description, resolved, recorded_at, entered_by)
         values ($1, $2, $3, false, $4, $5)`,
        [machineId, "OVERTEMP", "Bearing temperature exceeded normal range during routine check", daysAgo(3, 10), john]
      );
      await pool.query(
        `insert into fault_events (machine_id, code, description, resolved, recorded_at, entered_by)
         values ($1, $2, $3, false, $4, $5)`,
        [machineId, "LOW_OIL_PRESSURE", "Reported by site operator", daysAgo(1, 14), jane]
      );
    } else if (m.profile === "healthy" && Math.random() > 0.5) {
      await pool.query(
        `insert into fault_events (machine_id, code, description, resolved, resolved_at, recorded_at, entered_by)
         values ($1, $2, $3, true, $4, $5, $6)`,
        [machineId, "BELT_WEAR", "Fan belt showed early wear, replaced on site", daysAgo(11), daysAgo(9), admin]
      );
    }

    console.log(`Seeded ${m.name} (${m.profile}) — ${machineId}`);
  }

  console.log("DONE");
}

main()
  .catch((err) => {
    console.error("SEED ERROR:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
