const BASE = process.env.BASE || "http://localhost:4000";

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const results = [];
function check(name, got, expect, note = "") {
  const ok = got === expect;
  results.push({ name, got, expect, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${got} (expect ${expect}) ${note}`);
}

async function main() {
  const stamp = Date.now();
  const adminEmail = `admin_${stamp}@t.com`;
  const adminPass = "password123";
  const minerEmail = `miner_${stamp}@t.com`;

  const adminSignup = await req("POST", "/api/auth/signup", { body: { email: adminEmail, password: adminPass, role: "admin" } });
  check("signup admin -> 200", adminSignup.status, 200);
  const adminToken = adminSignup.data?.accessToken;
  check("admin token returned", adminToken ? 200 : 500, 200);

  const minerSignup = await req("POST", "/api/auth/signup", { body: { email: minerEmail, password: adminPass, role: "miner" } });
  check("signup miner -> 200", minerSignup.status, 200);
  const minerToken = minerSignup.data?.accessToken;

  const loginOk = await req("POST", "/api/auth/login", { body: { email: adminEmail, password: adminPass } });
  check("login correct creds -> 200", loginOk.status, 200);
  check("login returns accessToken", loginOk.data?.accessToken ? 200 : 500, 200);
  const loginBad = await req("POST", "/api/auth/login", { body: { email: adminEmail, password: "wrong" } });
  check("login wrong password -> 401", loginBad.status, 401);

  const me = await req("GET", "/api/auth/me", { token: adminToken });
  check("GET /api/auth/me (admin) -> 200", me.status, 200);
  check("me role is admin", me.data?.profile?.role === "admin" ? 200 : 500, 200);
  const meNoAuth = await req("GET", "/api/auth/me");
  check("GET /api/auth/me (no token) -> 401", meNoAuth.status, 401);

  const params = await req("GET", "/api/parameters", { token: adminToken });
  check("GET /api/parameters -> 200", params.status, 200);
  const paramList = params.data?.parameters || [];
  check("parameters has rows", Array.isArray(paramList) && paramList.length > 0 ? 200 : 500, 200);
  const paramsActive = await req("GET", "/api/parameters?machine_type=generator&active_only=true", { token: adminToken });
  check("GET /api/parameters?active_only -> 200", paramsActive.status, 200);

  const createMachine = await req("POST", "/api/machines", { token: adminToken, body: { name: "Gen A", location: "Site 1", phaseType: "three_phase" } });
  check("POST /api/machines (admin) -> 200", createMachine.status, 200);
  const machine = createMachine.data?.machine;
  const machineId = machine?.id;
  check("machine id returned", machineId ? 200 : 500, 200);
  const createMachineMiner = await req("POST", "/api/machines", { token: minerToken, body: { name: "X" } });
  check("POST /api/machines (miner) -> 403", createMachineMiner.status, 403);
  const listMachines = await req("GET", "/api/machines", { token: adminToken });
  check("GET /api/machines -> 200", listMachines.status, 200);
  check("machines list populated", (listMachines.data?.machines?.length ?? 0) > 0 ? 200 : 500, 200);
  const listMachinesActive = await req("GET", "/api/machines?active_only=true", { token: adminToken });
  check("GET /api/machines?active_only -> 200", listMachinesActive.status, 200);

  const paramId = paramList[0]?.id;
  const logReadings = await req("POST", "/api/readings", { token: minerToken, body: { machineId, recordedAt: new Date().toISOString(), entries: [{ parameterId: paramId, value: 42 }], notes: "test" } });
  check("POST /api/readings (miner) -> 200", logReadings.status, 200);
  const readingId = logReadings.data?.readings?.[0]?.id ?? logReadings.data?.id;
  const readingsMine = await req("GET", "/api/readings/mine", { token: minerToken });
  check("GET /api/readings/mine -> 200", readingsMine.status, 200);

  const refuel = await req("POST", "/api/refuel-events", { token: minerToken, body: { machineId, litersAdded: 100, recordedAt: new Date().toISOString(), notes: "top up" } });
  check("POST /api/refuel-events (miner) -> 200", refuel.status, 200);
  const refuelList = await req("GET", `/api/refuel-events?machine_id=${machineId}`, { token: adminToken });
  check("GET /api/refuel-events?machine_id -> 200", refuelList.status, 200);
  check("refuel list populated", (refuelList.data?.events?.length ?? 0) > 0 ? 200 : 500, 200);

  const fault = await req("POST", "/api/fault-events", { token: minerToken, body: { machineId, code: "OVL", description: "overload", recordedAt: new Date().toISOString() } });
  check("POST /api/fault-events (miner) -> 200", fault.status, 200);
  const faultId = fault.data?.event?.id ?? fault.data?.id;
  const faultList = await req("GET", `/api/fault-events?machine_id=${machineId}`, { token: adminToken });
  check("GET /api/fault-events?machine_id -> 200", faultList.status, 200);
  const faultUnresolved = await req("GET", `/api/fault-events?machine_id=${machineId}&unresolved_only=true`, { token: adminToken });
  check("GET /api/fault-events?unresolved_only -> 200", faultUnresolved.status, 200);
  const resolveFault = await req("POST", `/api/fault-events/${faultId}/resolve`, { token: adminToken });
  check("POST /api/fault-events/[id]/resolve (admin) -> 200", resolveFault.status, 200);
  const resolveFaultMiner = await req("POST", `/api/fault-events/${faultId}/resolve`, { token: minerToken });
  check("POST resolve (miner) -> 403", resolveFaultMiner.status, 403);

  const updateReading = await req("PATCH", `/api/readings/${readingId}`, { token: adminToken, body: { value: 99 } });
  check("PATCH /api/readings/[id] (admin) -> 200", updateReading.status, 200);
  const updateReadingMiner = await req("PATCH", `/api/readings/${readingId}`, { token: minerToken, body: { value: 1 } });
  check("PATCH /api/readings/[id] (miner) -> 403", updateReadingMiner.status, 403);
  const deleteReading = await req("DELETE", `/api/readings/${readingId}`, { token: adminToken });
  check("DELETE /api/readings/[id] (admin) -> 200", deleteReading.status, 200);

  const fleetSnap = await req("GET", "/api/metrics/fleet-snapshot", { token: adminToken });
  check("GET /api/metrics/fleet-snapshot -> 200", fleetSnap.status, 200);
  const machineSnap = await req("GET", `/api/metrics/machine/${machineId}`, { token: adminToken });
  check("GET /api/metrics/machine/[id] -> 200", machineSnap.status, 200);
  const dash = await req("GET", "/api/dashboard", { token: adminToken });
  check("GET /api/dashboard -> 200", dash.status, 200);
  const detail = await req("GET", `/api/machines/${machineId}/detail`, { token: adminToken });
  check("GET /api/machines/[id]/detail -> 200", detail.status, 200);
  const rec = await req("GET", `/api/machines/${machineId}/recommendation?sample_size=10`, { token: adminToken });
  check("GET /api/machines/[id]/recommendation -> 200", rec.status, 200);

  const repMachines = await req("GET", "/api/reports/machines", { token: adminToken });
  check("GET /api/reports/machines -> 200", repMachines.status, 200);
  const csv = await req("GET", `/api/reports/csv?machine_id=${machineId}`, { token: adminToken });
  check("GET /api/reports/csv -> 200", csv.status, 200);
  check("csv is text with header", typeof csv.data === "string" && csv.data.includes("Machine") ? 200 : 500, 200, csv.data ? `(${(csv.data.split("\n").length)} lines)` : "");

  const invite = await req("POST", "/api/admin/invite", { token: adminToken, body: { email: `invitee_${stamp}@t.com`, full_name: "New User", role: "it" } });
  check("POST /api/admin/invite (admin) -> 200", invite.status, 200);
  check("invite returns temp password", invite.data?.temporaryPassword ? 200 : 500, 200);
  const inviteMiner = await req("POST", "/api/admin/invite", { token: minerToken, body: { email: "x@t.com", full_name: "X", role: "it" } });
  check("POST /api/admin/invite (miner) -> 403", inviteMiner.status, 403);

  const passed = results.filter(r => r.ok).length;
  console.log(`\n==== ${passed}/${results.length} checks passed ====`);
  if (passed !== results.length) process.exitCode = 1;
}

main().catch(e => { console.error("TEST CRASH:", e); process.exit(2); });
