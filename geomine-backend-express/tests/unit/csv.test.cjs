const assert = require("node:assert/strict");
const { test } = require("node:test");
const { toCsv } = require("../../dist/csv.js");

test("writes the CSV header for an empty export", () => {
  assert.equal(
    toCsv([]),
    "Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n"
  );
});

test("quotes fields and escapes embedded quotes", () => {
  const csv = toCsv([
    {
      machine_name: 'Generator, "North"',
      parameter_label: "Oil temperature",
      value: 91.5,
      parameter_unit: "C",
      recorded_at: new Date("2026-02-03T04:05:06.000Z"),
      flagged: true,
      entry_method: "sensor",
    },
  ]);

  assert.equal(
    csv,
    'Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n"Generator, ""North""","Oil temperature","91.5","C","2026-02-03T04:05:06.000Z","yes","sensor"'
  );
});

test("serializes missing text fields and false flags consistently", () => {
  const csv = toCsv([
    {
      machine_name: null,
      parameter_label: null,
      value: 0,
      parameter_unit: null,
      recorded_at: new Date("2026-02-03T04:05:06.000Z"),
      flagged: false,
      entry_method: "manual",
    },
  ]);

  assert.equal(
    csv,
    'Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n"","","0","","2026-02-03T04:05:06.000Z","no","manual"'
  );
});