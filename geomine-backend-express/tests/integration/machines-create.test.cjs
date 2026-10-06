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

const makeRequest = (port, method, path, body, token) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : null;
  const req = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    },
    (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: text ? JSON.parse(text) : null,
        });
      });
    }
  );

  req.on("error", reject);
  if (payload) req.write(payload);
  req.end();
});

const setAdminStub = () => {
  prisma.profiles.findUnique = async () => ({
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "Admin User",
    role: "admin",
  });
  prisma.machines.create = async ({ data }) => ({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    ...data,
    status: "active",
    created_at: new Date("2025-01-01T00:00:00.000Z"),
    updated_at: new Date("2025-01-01T00:00:00.000Z"),
  });
};

const setMinerStub = () => {
  prisma.profiles.findUnique = async () => ({
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "Field User",
    role: "miner",
  });
};

test("POST /api/machines authorizes admins and rejects non-admins", async () => {
  setAdminStub();

  const adminApp = createApp();
  const adminServer = await listenOnEphemeralPort(adminApp);
  const adminPort = adminServer.address().port;
  const adminToken = jwt.sign({ sub: "11111111-1111-1111-1111-111111111111", role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  try {
    const adminResponse = await makeRequest(
      adminPort,
      "POST",
      "/api/machines",
      { name: "Generator 7", location: "North Plant", phaseType: "three_phase" },
      adminToken
    );

    assert.equal(adminResponse.statusCode, 200);
    assert.equal(adminResponse.body.machine.name, "Generator 7");
    assert.equal(adminResponse.body.machine.location, "North Plant");
    assert.equal(adminResponse.body.machine.phase_type, "three_phase");
  } finally {
    await new Promise((resolve) => adminServer.close(resolve));
  }

  setMinerStub();

  const minerApp = createApp();
  const minerServer = await listenOnEphemeralPort(minerApp);
  const minerPort = minerServer.address().port;
  const minerToken = jwt.sign({ sub: "22222222-2222-2222-2222-222222222222", role: "miner" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  try {
    const minerResponse = await makeRequest(
      minerPort,
      "POST",
      "/api/machines",
      { name: "Blocked Generator" },
      minerToken
    );

    assert.equal(minerResponse.statusCode, 403);
    assert.equal(minerResponse.body.error, "Not permitted");
  } finally {
    await new Promise((resolve) => minerServer.close(resolve));
  }
});
