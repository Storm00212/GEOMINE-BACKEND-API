const assert = require("node:assert/strict");
const { test } = require("node:test");
const http = require("node:http");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

const { createApp } = require("../../dist/server.js");
const { prisma } = require("../../dist/config.js");

const listenOnEphemeralPort = (app) => new Promise((resolve, reject) => {
  const server = app.listen(0, "127.0.0.1", () => resolve(server));
  server.on("error", reject);
});

const postJson = (port, path, body, token) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body);
  const request = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ statusCode: response.statusCode, body: text ? JSON.parse(text) : null });
      });
    }
  );

  request.on("error", reject);
  request.end(payload);
});

test("POST /api/help/chat requires auth and returns localized fallback guidance", async () => {
  const previousApiKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  prisma.profiles.findUnique = async () => ({
    id: "33333333-3333-3333-3333-333333333333",
    full_name: "Help Test User",
    role: "miner",
  });

  const server = await listenOnEphemeralPort(createApp());
  const port = server.address().port;
  const token = jwt.sign(
    { sub: "33333333-3333-3333-3333-333333333333", role: "miner" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  try {
    const unauthenticated = await postJson(port, "/api/help/chat", {
      message: "How do I log a reading?",
      language: "en",
      pathname: "/entry",
    });
    assert.equal(unauthenticated.statusCode, 401);

    const authenticated = await postJson(
      port,
      "/api/help/chat",
      { message: "Ninawekaje kipimo?", language: "sw", pathname: "/entry" },
      token
    );
    assert.equal(authenticated.statusCode, 200);
    assert.match(authenticated.body.reply, /Kurekodi kipimo/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete prisma.profiles.findUnique;
    if (previousApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousApiKey;
  }
});
