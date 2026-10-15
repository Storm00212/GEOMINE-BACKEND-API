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
    const englishRoles = await askHelpAssistant("Explain the admin and miner roles", "en", "/");
    const swahiliRoles = await askHelpAssistant("Eleza majukumu ya msimamizi na mchimbaji", "sw", "/");
    const websiteOverview = await askHelpAssistant("What is this website for?", "en", "/");

    assert.match(englishReply, /log a reading/i);
    assert.match(swahiliReply, /Kurekodi kipimo/);
    assert.match(englishRoles, /admin/i);
    assert.match(englishRoles, /miner/i);
    assert.match(englishRoles, /invite users/i);
    assert.match(englishRoles, /fault/i);
    assert.match(swahiliRoles, /msimamizi/i);
    assert.match(swahiliRoles, /wachimbaji|mchimbaji/i);
    assert.match(swahiliRoles, /watumiaji/i);
    assert.match(websiteOverview, /predictive[- ]maintenance/i);
    assert.match(websiteOverview, /reports/i);
    await assert.rejects(askHelpAssistant(" ", "en", "/"), ValidationError);
    await assert.rejects(askHelpAssistant("x".repeat(1001), "en", "/"), ValidationError);
  } finally {
    if (previousApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousApiKey;
  }
});
