const BASE = "http://localhost:4000";
async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, raw: text };
}
const email = `diag_${Date.now()}@t.com`;
const s = await req("POST", "/api/auth/signup", { body: { email, password: "password123", role: "admin" } });
const token = s.data.accessToken;
const m = await req("POST", "/api/machines", { token, body: { name: "D", phaseType: "three_phase" } });
const machineId = m.data.machine.id;
const p = await req("GET", "/api/parameters", { token });
const paramId = p.data.parameters[0].id;
const r = await req("POST", "/api/readings", { token, body: { machineId, recordedAt: new Date().toISOString(), entries: [{ parameterId: paramId, value: 1 }] } });
const readingId = r.data.readings[0].id;
console.log("readingId:", readingId);
const patch = await req("PATCH", `/api/readings/${readingId}`, { token, body: { value: 5 } });
console.log("PATCH reading:", patch.status, JSON.stringify(patch.data));
const del = await req("DELETE", `/api/readings/${readingId}`, { token });
console.log("DELETE reading:", del.status, JSON.stringify(del.data));
const f = await req("POST", "/api/fault-events", { token, body: { machineId, code: "X", recordedAt: new Date().toISOString() } });
const faultId = f.data.event.id;
console.log("faultId:", faultId);
const res = await req("POST", `/api/fault-events/${faultId}/resolve`, { token });
console.log("POST resolve:", res.status, JSON.stringify(res.data));
