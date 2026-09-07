// Simulate what the frontend does: log in, then call /api/dashboard with the token
const loginRes = await fetch("https://geomine-backend-api-backend.onrender.com/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "muyali.khamala23@students.dkut.ac.ke", password: "12201PAULKHAMS" }),
});
const { accessToken } = await loginRes.json();

for (const path of ["/api/dashboard", "/api/machines", "/api/readings/mine?limit=10"]) {
  const r = await fetch("https://geomine-backend-api-backend.onrender.com" + path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const txt = await r.text();
  console.log(`\n=== ${path} ===`);
  console.log(`STATUS: ${r.status}`);
  console.log(`BODY (first 800 chars): ${txt.slice(0, 800)}`);
}
