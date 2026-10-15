const assert = require("node:assert/strict");
const { test } = require("node:test");
const { askHelpAssistant } = require("../../dist/help-assistant.js");
const { ValidationError } = require("../../dist/types.js");

test("provides bilingual local help and validates question length", async () => {
  const previousApiKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    const englishReply = await askHelpAssistant("How do I enter this?", "en", "/entry");
    const swahiliReply = await askHelpAssistant("Ninawekaje kipimo?", "sw", "/entry");

    assert.match(englishReply, /log a reading/i);
    assert.match(swahiliReply, /Kurekodi kipimo/);
    await assert.rejects(askHelpAssistant(" ", "en", "/"), ValidationError);
    await assert.rejects(askHelpAssistant("x".repeat(1001), "en", "/"), ValidationError);
  } finally {
    if (previousApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousApiKey;
  }
});
