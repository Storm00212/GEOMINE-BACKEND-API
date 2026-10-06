const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const http = require("node:http");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

const { createApp } = require("../../dist/server.js");
const { prisma } = require("../../dist/config.js");

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

beforeEach(() => {
  setAdminStub();
});

afterEach(() => {
  setAdminStub();
});

test("POST /api/machines allows admin users to create a generator", { concurrency: false }, async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  const { port } = server.address();

  const token = jwt.sign({ sub: "11111111-1111-1111-1111-111111111111", role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  try {
    const response = await makeRequest(
      port,
      "POST",
      "/api/machines",
      { name: "Generator 7", location: "North Plant", phaseType: "three_phase" },
      token
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.machine.name, "Generator 7");
    assert.equal(response.body.machine.location, "North Plant");
    assert.equal(response.body.machine.phase_type, "three_phase");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("POST /api/machines rejects non-admin users", { concurrency: false }, async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  const { port } = server.address();

  const token = jwt.sign({ sub: "22222222-2222-2222-2222-222222222222", role: "miner" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  prisma.profiles.findUnique = async () => ({
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "Field User",
    role: "miner",
  });

  try {
    const response = await makeRequest(
      port,
      "POST",
      "/api/machines",
      { name: "Blocked Generator" },
      token
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.body.error, "Not permitted");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
