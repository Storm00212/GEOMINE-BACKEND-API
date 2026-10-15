import { ValidationError } from "./types";

type HelpLanguage = "en" | "sw";

const helpText = {
  en: {
    welcome: "I can help you find your way around Geomine PMS. Ask about logging readings, generators, fleet health, or reports.",
    reading: "To log a reading, open Log a reading, choose the generator and parameter, enter the value and time, then submit. You can review your submissions in Reading history.",
    machines: "Open Generators to inspect the fleet. Administrators can choose Add generator, enter its name and site, select its electrical phase, and submit.",
    reports: "Open Export data to choose a generator and date range, review the report, then download the CSV.",
    dashboard: "Open Fleet overview for fleet health, recent readings, and issues that need attention. Select a generator to inspect its details and trends.",
  },
  sw: {
    welcome: "Naweza kukusaidia kutumia Geomine PMS. Uliza kuhusu kurekodi vipimo, jenereta, hali ya mtambo, au ripoti.",
    reading: "Kurekodi kipimo, fungua Rekodi kipimo, chagua jenereta na kipengele, weka thamani na muda, kisha tuma. Unaweza kukagua ulivyotuma kwenye Historia ya vipimo.",
    machines: "Fungua Jenereta kukagua mtambo. Wasimamizi wanaweza kuchagua Ongeza jenereta, kuweka jina na eneo, kuchagua awamu ya umeme, kisha kutuma.",
    reports: "Fungua Hamisha data kuchagua jenereta na kipindi, kagua ripoti, kisha pakua faili la CSV.",
    dashboard: "Fungua Muhtasari wa mtambo kuona afya ya mtambo, vipimo vya hivi karibuni, na matatizo yanayohitaji uangalizi. Chagua jenereta kuona maelezo na mwenendo wake.",
  },
} satisfies Record<HelpLanguage, Record<string, string>>;

function localReply(message: string, language: HelpLanguage, pathname: string): string {
  const text = helpText[language];
  const query = message.toLowerCase();

  if (/reading|kipim|measure|rekod|entry|history|historia/.test(query) || pathname.startsWith("/entry")) {
    return text.reading;
  }
  if (/generator|machine|jenereta|mtambo/.test(query) || pathname.startsWith("/machines")) {
    return text.machines;
  }
  if (/report|export|csv|ripoti|hamish/.test(query) || pathname.startsWith("/reports")) {
    return text.reports;
  }
  if (/dashboard|fleet|health|muhtasari|afya/.test(query) || pathname.startsWith("/dashboard")) {
    return text.dashboard;
  }

  return text.welcome;
}

export async function askHelpAssistant(
  message: unknown,
  language: unknown,
  pathname: unknown
): Promise<string> {
  if (typeof message !== "string" || !message.trim()) {
    throw new ValidationError("A message is required");
  }
  if (message.trim().length > 1000) {
    throw new ValidationError("Message must be 1000 characters or fewer");
  }

  const resolvedLanguage: HelpLanguage = language === "sw" ? "sw" : "en";
  const resolvedPath = typeof pathname === "string" ? pathname.slice(0, 200) : "/";
  const fallback = localReply(message.trim(), resolvedLanguage, resolvedPath);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              `You are the concise help guide for Geomine PMS, a generator predictive-maintenance app. Reply only in ${resolvedLanguage === "sw" ? "Kiswahili" : "English"}. Explain only these workflows: fleet dashboard, generator list/details, logging readings and reviewing history, exporting CSV reports, and admin-only generator creation. Never claim to change data or perform actions. Current page: ${resolvedPath}. Keep the answer under 100 words.`,
          },
          { role: "user", content: message.trim() },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return fallback;
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = result.choices?.[0]?.message?.content?.trim();
    return reply || fallback;
  } catch {
    return fallback;
  }
}
