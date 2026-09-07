// Look for the dashboard and machine detail chunks, plus the BACKEND_URL in any JS.
const html = await (await fetch("https://geomine-backend-api-frontend.onrender.com/")).text();
console.log("HTML length:", html.length);
console.log(html.slice(0, 2000));

// Crawl all chunks referenced
const allSrcs = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map(m => m[1]);
console.log("\n=== All static asset paths ===");
allSrcs.forEach(s => console.log("  ", s));

// Get each one and look for the backend URL string
console.log("\n=== Searching for backend URL in chunks ===");
for (const src of allSrcs) {
  try {
    const r = await fetch("https://geomine-backend-api-frontend.onrender.com" + src);
    if (!r.ok) { console.log(`SKIP ${src}: ${r.status}`); continue; }
    const txt = await r.text();
    const urls = txt.match(/https?:\/\/[a-z0-9.\-]+(?::\d+)?/gi) || [];
    if (urls.length > 0) {
      console.log(`\n--- ${src} (${txt.length} bytes) ---`);
      [...new Set(urls)].forEach(u => console.log("  ", u));
    }
  } catch (e) {
    console.log(`FAIL ${src}: ${e.message}`);
  }
}
