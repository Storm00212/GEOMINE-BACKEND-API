// Find the deployed frontend's build and inspect what NEXT_PUBLIC_BACKEND_URL was baked in.
const html = await (await fetch("https://geomine-backend-api-frontend.onrender.com/")).text();

// Find the main-app chunk
const m = html.match(/<script[^>]*src="([^"]*main-app[^"]*)"/);
const altM = html.match(/<script[^>]*src="([^"]*\/_next\/static\/[^"]*\.js)"/g) || [];
console.log("main-app match:", m?.[1]);
console.log("all script srcs:", altM.map(s => s.match(/src="([^"]*)"/)?.[1]));

// Fetch the main-app chunk
let js = "";
if (m) {
  const r = await fetch("https://geomine-backend-api-frontend.onrender.com" + m[1]);
  js = await r.text();
} else {
  // Try common chunk names
  for (const name of ["app", "main-app", "framework"]) {
    try {
      const r = await fetch(`https://geomine-backend-api-frontend.onrender.com/_next/static/chunks/${name}.js`);
      if (r.ok) { js += "\n--- " + name + " ---\n" + await r.text(); }
    } catch {}
  }
}

// Search for backend URL occurrences
const urls = [...new Set(js.match(/https?:\/\/[a-z0-9.\-]+(:\d+)?/gi) || [])];
console.log("\n=== URLs in main-app.js ===");
urls.forEach(u => console.log("  ", u));
