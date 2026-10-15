import { ValidationError } from "@/lib/modules/readings";

type HelpLanguage = "en" | "sw";

const helpText = {
  en: {
    welcome: "I can help you find your way around Geomine PMS. Ask about logging readings, generators, fleet health, or reports.",
    roles: "Admin has full oversight: view fleet health and generator trends, add generators, invite users and assign roles, export reports, review and resolve faults, correct readings, and remove readings when needed. Miners work in the field: they log generator readings, review their own reading history, and submit refuel and fault events. Miners cannot manage users, add generators, delete readings, or access the IT/admin dashboard and reports. IT users can review fleet and generator health, export reports, correct readings, and resolve faults, but cannot invite users, add generators, or delete readings.",
    about: "Geomine PMS is a predictive-maintenance website for an organization's generator fleet. Fleet overview summarizes generator health, recent readings, and flagged values. Generators stores each asset's identity and health trends. Log a reading records parameter values and timestamps; Reading history lets users review submissions. Refuel and fault events capture operational incidents. Reports filter activity by generator and date range and export CSV files. Out-of-range readings help teams investigate problems before they become failures.",
    reading: "To log a reading, open Log a reading, choose the generator and parameter, enter the value and time, then submit. You can review your submissions in Reading history.",
    machines: "Open Generators to inspect the fleet. Administrators can choose Add generator, enter its name and site, select its electrical phase, and submit.",
    reports: "Open Export data to choose a generator and date range, review the report, then download the CSV.",
    dashboard: "Open Fleet overview for fleet health, recent readings, and issues that need attention. Select a generator to inspect its details and trends.",
  },
  sw: {
    welcome: "Naweza kukusaidia kutumia Geomine PMS. Uliza kuhusu kurekodi vipimo, jenereta, hali ya mtambo, au ripoti.",
    roles: "Msimamizi (Admin) ana usimamizi mpana: huangalia afya ya mtambo na mwenendo wa jenereta, huongeza jenereta, hualika watumiaji na kuwapa majukumu, huhamisha ripoti, hukagua na kutatua hitilafu, husahihisha vipimo, na anaweza kufuta vipimo inapohitajika. Wachimbaji (Miner) hufanya kazi eneo la jenereta: hurekodi vipimo, hukagua historia yao ya vipimo, na hutuma matukio ya kujaza mafuta au hitilafu. Wachimbaji hawawezi kusimamia watumiaji, kuongeza jenereta, kufuta vipimo, au kutumia dashibodi na ripoti za IT/Admin. Watumiaji wa IT hukagua afya ya mtambo na jenereta, huhamisha ripoti, husahihisha vipimo na kutatua hitilafu, lakini hawaaliki watumiaji, hawaongezi jenereta, wala kufuta vipimo.",
    about: "Geomine PMS ni tovuti ya matengenezo ya ubashiri kwa jenereta za shirika. Muhtasari wa Mtambo unaonyesha afya ya jenereta, vipimo vya hivi karibuni na vipimo vilivyo nje ya kiwango. Sehemu ya Jenereta huhifadhi utambulisho wa kila mashine na mwenendo wa afya yake. Rekodi kipimo huhifadhi thamani na muda; Historia ya vipimo hukuwezesha kukagua ulivyotuma. Matukio ya kujaza mafuta na hitilafu hurekodi matukio ya kazi. Ripoti huchuja taarifa kwa jenereta na kipindi na kupakua faili za CSV. Vipimo vilivyo nje ya kiwango husaidia timu kuchunguza matatizo mapema.",
    reading: "Kurekodi kipimo, fungua Rekodi kipimo, chagua jenereta na kipengele, weka thamani na muda, kisha tuma. Unaweza kukagua ulivyotuma kwenye Historia ya vipimo.",
    machines: "Fungua Jenereta kukagua mtambo. Wasimamizi wanaweza kuchagua Ongeza jenereta, kuweka jina na eneo, kuchagua awamu ya umeme, kisha kutuma.",
    reports: "Fungua Hamisha data kuchagua jenereta na kipindi, kagua ripoti, kisha pakua faili la CSV.",
    dashboard: "Fungua Muhtasari wa mtambo kuona afya ya mtambo, vipimo vya hivi karibuni, na matatizo yanayohitaji uangalizi. Chagua jenereta kuona maelezo na mwenendo wake.",
  },
} satisfies Record<HelpLanguage, Record<string, string>>;

function localReply(message: string, language: HelpLanguage, pathname: string): string {
  const text = helpText[language];
  const query = message.toLowerCase();

  if (/admin|administrator|miner|role|permission|msimamizi|mchimbaji|jukumu|majukumu|ruhusa|wajibu/.test(query)) {
    return text.roles;
  }
  if (/about|website|application|software|what is|geomine|tovuti|kuhusu|mfumo|programu|kinafanya nini/.test(query)) {
    return text.about;
  }
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
        max_tokens: 480,
        messages: [
          {
            role: "system",
            content:
              `You are the knowledgeable help guide for Geomine PMS, a predictive-maintenance website for an organization's generator fleet. Reply only in ${resolvedLanguage === "sw" ? "Kiswahili" : "English"}. Give detailed, factual answers about the website and its roles. Admins can view fleet health and generator trends, add generators, invite users and assign roles, export reports, review/resolve faults, correct readings, delete readings, and submit readings/events. Miners log generator readings, review their own reading history, and submit refuel/fault events; they cannot manage users, add generators, delete readings, or use IT/admin dashboards and reports. IT users can view fleet/generator health, export reports, correct readings, and resolve faults, but cannot invite users, add generators, or delete readings. Explain the dashboard, generator records/trends, readings/history, refuel/fault events, and CSV reports when asked. Never claim to change data or perform actions. Current page: ${resolvedPath}. Keep answers informative and under 180 words.`,
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