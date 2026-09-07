// Fetch the dashboard page and find its specific JS chunks
for (const path of ["/dashboard", "/machines/dd644018-ddda-4bbc-adad-383545eafc2a", "/entry"]) {
  const html = await (await fetch("https://geomine-backend-api-frontend.onrender.com" + path)).text();
  console.log(`\n=== ${path} ===`);
  const srcs = [...html.matchAll(/<script[^>]*src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
  console.log("Chunks:", srcs.length);
  for (const src of srcs) {
    const r = await fetch("https://geomine-backend-api-frontend.onrender.com" + src);
    if (!r.ok) continue;
    const txt = await r.text();
    const urls = txt.match(/https?:\/\/[a-z0-9.\-]+(?::\d+)?/gi) || [];
    if (urls.length > 0) {
      console.log(`  ${src.split("/").pop()}:`);
      [...new Set(urls)].forEach(u => console.log("    ->", u));
    }
  }
}
