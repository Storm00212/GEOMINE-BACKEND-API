"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { backendFetchClient } from "@/lib/backend-client-browser";

type Language = "en" | "sw";
type Mode = "tour" | "chat";
type Message = { role: "user" | "assistant"; content: string };

const copy = {
  en: {
    help: "Help",
    title: "Geomine guide",
    tour: "Walkthrough",
    chat: "Ask for help",
    language: "Language",
    start: "Start walkthrough",
    previous: "Previous",
    next: "Next",
    finish: "Finish",
    openPage: "Open this page",
    step: "Step",
    of: "of",
    question: "What are you stuck on?",
    placeholder: "Ask about readings, generators, reports, roles…",
    send: "Send",
    thinking: "Thinking…",
    greeting: `Hi. I can walk you through every part of Geomine PMS: signing up, logging readings, the fleet dashboard, generators, reports, admin invites, deleting readings and generators, user roles and permissions, and how the software works underneath. Pick the walkthrough or type a question.`,
    unavailable: "I couldn't reach the guide right now. Please try again.",
    steps: [
      {
        title: "Home — create or sign in to an account",
        detail: "From the landing page you can sign in with an existing account or create a new one. During sign-up you choose your role: Miner (logs readings) or Admin (full fleet and user management). IT accounts are created by an administrator via the Invite user page.",
        href: "/",
      },
      {
        title: "Sign up — self-register as Miner or Admin",
        detail: "On the sign-up form enter your work email, a password of at least 8 characters, confirm it, then pick your role. The backend validates the role on the server so a Miner account cannot escalate itself to Admin. You are logged in automatically after sign-up.",
        href: "/login?mode=signup",
      },
      {
        title: "Sign in",
        detail: "Enter your registered email and password. The backend issues a signed JWT access token that is stored in your browser and sent with every request. Sign out from any authenticated page using Log out.",
        href: "/login",
      },
      {
        title: "Log a reading",
        detail: "Choose a generator, set the reading time (defaults to now), and enter values for each generator parameter such as output current, voltage, speed, bearing temperature, and power factor. Submit saves the reading and flags any value outside the expected range.",
        href: "/entry",
      },
      {
        title: "Reading history — your logged entries",
        detail: "Lists the last readings you submitted, with machine name, parameter, value, unit, and time. Readings outside the expected range are marked OUT OF RANGE. Administrators see a Delete button on each reading to remove incorrect or false entries; Miners cannot delete readings.",
        href: "/entry/history",
      },
      {
        title: "Fleet overview — dashboard",
        detail: "Shows all generators sorted by maintenance priority, with health index, loading percentage, and priority score. Use the 7 / 30 / 60 day range buttons and the All / Needs maintenance / Watch / Healthy filter chips. Flagged readings are grouped below by machine. Click Export to download a CSV report.",
        href: "/dashboard",
      },
      {
        title: "Generators — fleet list",
        detail: "Lists every registered generator with its location, status, loading, health, and priority. Administrators see an Add generator button and a Delete button on each generator row. Only administrators can add or delete generators.",
        href: "/machines",
      },
      {
        title: "Generator detail page",
        detail: "Open a generator to see its health gauge, loading, maintenance priority, maintenance recommendation, open faults, and a chart of its parameter history over time.",
        href: "/machines/:id",
      },
      {
        title: "Add a generator (admin only)",
        detail: "Administrators register a new generator with a name, optional site/location, and electrical phase (three phase or single phase). The backend enforces admin-only access.",
        href: "/machines/new",
      },
      {
        title: "Delete a generator (admin only)",
        detail: "From the Generators list, administrators can click Delete on any generator row and confirm. The backend enforces admin-only access and deletes the generator row.",
        href: "/machines",
      },
      {
        title: "Delete a reading (admin only)",
        detail: "From Reading history, administrators can click Delete on any reading and confirm. The backend enforces admin-only access and deletes the reading row. Miners cannot delete readings.",
        href: "/entry/history",
      },
      {
        title: "Reports — export readings to CSV",
        detail: "Choose a generator (or all), set an optional from/to date range, and download a CSV file of logged readings. The download carries your JWT bearer token so the backend authenticates the export request.",
        href: "/reports",
      },
      {
        title: "Invite a user (admin only)",
        detail: "Administrators send role-scoped invites to new team members: Miner (logs readings), IT (analyzes and exports), or Admin (full management). The backend generates a temporary password the administrator relays to the new user.",
        href: "/admin/users/new",
      },
      {
        title: "User roles and permissions",
        detail: "Miner: log readings, view own reading history, view machines and dashboard (read-only). IT: everything a Miner can do, plus export reports, correct readings, and resolve faults. Admin: everything IT can do, plus add/delete generators, delete readings, and invite/manage users. No user can change their own role; only an administrator can create Admin or IT accounts.",
        href: "/dashboard",
      },
      {
        title: "Password reset (administrator-assisted)",
        detail: "Self-service password reset is not available. If you forget your password, ask an administrator to invite you again — they generate a new temporary password you can use to sign in.",
        href: "/reset-password",
      },
      {
        title: "How the software works underneath",
        detail: "Geomine PMS is a Next.js frontend talking to a Next.js/Node backend over HTTPS. The backend uses Neon Postgres with a custom app_users table (email + bcrypt password hash + role) and a profiles table. On login the backend verifies credentials, issues a signed JWT (7-day expiry) carrying your id and role, and stores it in localStorage. Every request sends the token as a Bearer header. The backend checks profiles.role (the database row, not just the JWT claim) on every protected route, so a forged JWT cannot override your stored role. Row Level Security policies on machines and readings enforce the same admin-only boundaries at the database layer. Passwords are never stored or logged in plain text.",
        href: "/dashboard",
      },
    ],
  },
  sw: {
    help: "Msaada",
    title: "Mwongozo wa Geomine",
    tour: "Mwongozo wa hatua",
    chat: "Uliza msaada",
    language: "Lugha",
    start: "Anza mwongozo",
    previous: "Iliyotangulia",
    next: "Inayofuata",
    finish: "Maliza",
    openPage: "Fungua ukurasa huu",
    step: "Hatua",
    of: "kati ya",
    question: "Umekwama wapi?",
    placeholder: "Uliza kuhusu vipimo, jenereta, ripoti, majukumu…",
    send: "Tuma",
    thinking: "Inatafuta…",
    greeting: `Hujambo. Naweza kuwafanyia mwongozo kila sehemu ya Geomine PMS: kujiandikisha, kutuma vipimo, dashibodi ya mtambo, jenereta, ripoti, kuwalika watumiaji, kufuta vipimo na jenereta, majukumu na ruhusa, na jinsi programu inavyofanya kazi ndani. Chagua mwongozo au uliza swali.`,
    unavailable: "Sikuweza kuwasiliana na mwongozo. Tafadhali jaribu tena.",
    steps: [
      {
        title: "Nyumbani — jiandikishe au uingizwe",
        detail: "Kwenye ukurasa wa msingi unaweza kuingia na akaunti iliyopangwa au kujenga akaunti mpya. Wakati wa kujiandikisha una chagua jukumu lako: Wachimbaji (hurekodi vipimo) au Msimamizi (usimamizi wa kila kitu ya mtambo na waowala). Akaunti ya IT hufanywa na msimamizi kutoka ukurasa wa Kuwaachia Mwenza.",
        href: "/",
      },
      {
        title: "Kujiandikisha — usajiri binafsi kama Mchimbaji au Msimamizi",
        detail: "Kwenye fomu ya kujiandikisha weza barua pepe yako ya kazi, nenosiri siri ya tamthili ya 8 au zaidi, thinishisha, kisha chagua jukumu. Nyakati inategemea jukumu kwenye seversi hivyo akaunti ya Mchimbaji haliwezi kuendesha kuwa Msimamizi. Unaingizwa automatic baada ya kujiandikisha.",
        href: "/login?mode=signup",
      },
      {
        title: "Kuingia",
        detail: "Weka barua pepe yako iliyopangwa na nenosiri siri. Nyakati inatoa token sahihi ya JWT ya ruzuku ambayo ni hifadhiwa kwenye readhura yako na kutumwa kila ombi. Ondoka kutoka ukurasa yoyote inayotumika kutumia Log out.",
        href: "/login",
      },
      {
        title: "Rekodi kipimo",
        detail: "Chagua jenereta, weka muda wa kipimo (hudumu ni sasa), na weza thamani za kila sehemu ya jenereta kama sasa ya kuweka, voltage, speed, joto la bearing, na power factor. Tuma hufunga kipimo na kuangalia thamani yoyote nje ya kipengele cha kuangaliwa.",
        href: "/entry",
      },
      {
        title: "Historia ya vipimo — vipimo vyaliyotumwa",
        detail: "Wacha vipimo vya hivi karibuni uliyotuma, na jina la mtambo, sehemu, thamani, kazi, na muda. Kipimo cha nje ya kipengele cha kuangaliwa hushambuliwa OUT OF RANGE. Wasimamizi wanaonewa Delete kwenye kila kipimo kuondoa vipimo si sahihi au vya uongo. Wachimbaji hawiwezi kuondoa vipimo.",
        href: "/entry/history",
      },
      {
        title: "Muhtasari wa mtambo — dashibodi",
        detail: "Wacha jenereta zote zilizosajiliwa kwenye usawa wa ubunifu, na indexi ya afya, asilimia ya kuweka, na nambari ya ubunifu. Tumia viambatishi vya siku 7 / 30 / 60 na vipande vya All / Needs maintenance / Watch / Healthy. Kipimo chafu vikangwa kwenye mtambo hivi karibuni. Bonyeza Export ku download faili CSV.",
        href: "/dashboard",
      },
      {
        title: "Jenereta — orodha ya mtambo",
        detail: "Wacha jenereta zote zilizosajiliwa na eneo, hali, kuweka, afya, na nambari ya ubunifu. Wasimamizi wanaonewa Add generator na Delete kwenye kila sehemu. Wasimamizi pekee wanaweza kuongeza au kuondoa jenereta.",
        href: "/machines",
      },
      {
        title: "Ukurasa wa kwanza wa jenereta",
        detail: "Fungua jenereta kuona gauji ya afya, kuweka, ubunifu wa ubunifu, shauri ya ubunifu, hitilafu zisizoitwa, na chati ya historia ya sehemu za mwendo.",
        href: "/machines/:id",
      },
      {
        title: "Ongeza jenereta (wasimamizi pekee)",
        detail: "Wasimamizi wanasajili jenereta mpya na jina, eneo/location (tathmini), na awamu ya umeme (three phase au single phase). Nyakati inategemea usimamizi pekee.",
        href: "/machines/new",
      },
      {
        title: "Futa jenereta (wasimamizi pekee)",
        detail: "Kwenye orodha ya Jenereta, wasimamizi wanaweza bonyeza Delete kwenye sehemu yoyote ya jenereta na usabuni. Nyakati inategemea usimamizi pekee na kuondoa sehemu ya jenereta.",
        href: "/machines",
      },
      {
        title: "Futa kipimo (wasimamizi pekee)",
        detail: "Kwenye Historia ya vipimo, wasimamizi wanaweza bonyeza Delete kwenye kipimo yoyote na usabuni. Nyakati inategemea usimamizi pekee na kuondoa sehemu ya kipimo. Wachimbaji hawiwezi kuondoa kipimo.",
        href: "/entry/history",
      },
      {
        title: "Ripoti — download vipimo kama CSV",
        detail: "Chagua jenereta (au zote), weka tovuti ya tarehe ya kuanza / kuisha, na download faili ya CSV ya vipimo zilizopangwa. Download inatuma token yako ya JWT kuangalia ombi ya kuagiza kutoka nyakati.",
        href: "/reports",
      },
      {
        title: "Waliza mwenyewe (wasimamizi pekee)",
        detail: "Wasimamizi wanasoma ahadi ya kazi za ufunguza kwa watu wengine wa kundi: Mchimbaji (hurekodi vipimo), IT (hukagua na kuagiza), au Msimamizi (usimamizi wote). Nyakati inatoa nenosiri siri cha hivi karibuni msimamizi ataridhishi kwenye mwenye akaunti mpya.",
        href: "/admin/users/new",
      },
      {
        title: "Majukumu na ruhusa",
        detail: "Mchimbaji: rekodi vipimo, angalia historia yako ya vipimo, angalia mtambo na dashibodi (kupanga pekee). IT: kila kitu Mchimbaji anaweza, kuongeza kuagiza ripoti, kurekebisha vipimo, na kuwaweza hitilafu. Msimamizi: kila kitu IT anaweza, kuongeza/ondoa jenereta, kuondoa vipimo, na kuwalia/kutumia watumiaji. Mtu ye yeyote hawiwezi kubadili jukumu yake mwenyewe; wasimamizi pekee wanaweza kuunda akaunti za Admin au IT.",
        href: "/dashboard",
      },
      {
        title: "Mwongezo wa nenosiri (msimamizi-osaidi)",
        detail: "Kuweka nenosiri tena binafsi hapatikani. Ukiolewa nenosiri yako,eleza msimamizi kuwalia tena — watazoa nenosiri siri mpya unaweza kutumia kuingia.",
        href: "/reset-password",
      },
      {
        title: "Jinsi programu inavyofanya kazi ndani",
        detail: "Geomine PMS ni Next.js readhura inayomwagizia nyakati Next.js/Node kwenye HTTPS. Nyakati inatumia Neon Postgres na app_users (barua pepe + nenosiri siri ya bcrypt + jukumu) na profiles. Wakati wa kuingia nyakati inangalia kinambulishi, inatoa JWT sahihi (rufuku za siku 7) yenye id na jukumu yako, na hifadhishi localStorage. Kila ombi inatuma token kama Bearer header. Nyakati inategemia profiles.row (baraza ya data, si pekee ya JWT) kila njia iliyoangaliwa, hivyo JWT isiyo sahihi haliwezi kubadilisha jukumu yako hifadhiwa. RLS kwenye machines na readings inategemia upana usimamizi pekee kwenye baraza la data. Nenosiri hosiifaki au kuguliwa kwa neno puu.",
        href: "/dashboard",
      },
    ],
  },
} satisfies Record<Language, {
  help: string;
  title: string;
  tour: string;
  chat: string;
  language: string;
  start: string;
  previous: string;
  next: string;
  finish: string;
  openPage: string;
  step: string;
  of: string;
  question: string;
  placeholder: string;
  send: string;
  thinking: string;
  greeting: string;
  unavailable: string;
  steps: { title: string; detail: string; href: string }[];
}>;

const TOUR_KEY = "geomine-help-tour";

export function HelpAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("tour");
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const text = copy[language];
  const currentStep = text.steps[stepIndex];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("geomine-help-language");
    if (storedLanguage === "en" || storedLanguage === "sw") setLanguage(storedLanguage);

    const savedTour = window.sessionStorage.getItem(TOUR_KEY);
    if (savedTour) {
      const parsedStep = Number(savedTour);
      if (Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep < copy.en.steps.length) {
        setStepIndex(parsedStep);
        setMode("tour");
        setOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function selectLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("geomine-help-language", nextLanguage);
  }

  function startTour() {
    setStepIndex(0);
    setMode("tour");
    setOpen(true);
    window.sessionStorage.setItem(TOUR_KEY, "0");
    router.push(copy[language].steps[0].href);
  }

  function moveTour(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= text.steps.length) {
      window.sessionStorage.removeItem(TOUR_KEY);
      setOpen(false);
      return;
    }
    setStepIndex(nextIndex);
    window.sessionStorage.setItem(TOUR_KEY, String(nextIndex));
    router.push(text.steps[nextIndex].href);
  }

  function closePanel() {
    setOpen(false);
    window.sessionStorage.removeItem(TOUR_KEY);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;

    setMessages((existing) => [...existing, { role: "user", content: message }]);
    setDraft("");
    setSending(true);

    try {
      const response = await backendFetchClient("/api/help/chat", {
        method: "POST",
        body: JSON.stringify({ message, language, pathname }),
      });
      const body = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!response.ok || !body.reply) throw new Error(body.error || text.unavailable);
      setMessages((existing) => [...existing, { role: "assistant", content: body.reply! }]);
    } catch {
      setMessages((existing) => [...existing, { role: "assistant", content: text.unavailable }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <section
          aria-label={text.title}
          className="fixed bottom-[76px] right-3 z-[70] flex max-h-[78vh] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-2xl md:bottom-6 md:right-[76px]"
        >
          <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <div>
              <h2 className="text-[14px] font-semibold">{text.title}</h2>
              <div className="mt-1 flex items-center gap-1 font-mono text-[9px] text-ink-faint">
                <span>{text.language}:</span>
                <button type="button" onClick={() => selectLanguage("en")} aria-pressed={language === "en"} className={language === "en" ? "text-cyan" : "hover:text-ink"}>EN</button>
                <span>/</span>
                <button type="button" onClick={() => selectLanguage("sw")} aria-pressed={language === "sw"} className={language === "sw" ? "text-cyan" : "hover:text-ink"}>SW</button>
              </div>
            </div>
            <button type="button" onClick={closePanel} aria-label="Close help" className="flex h-8 w-8 items-center justify-center rounded-md text-ink-dim hover:bg-panel-alt hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
            </button>
          </header>

          <div className="grid grid-cols-2 border-b border-line-soft p-2">
            <button type="button" onClick={() => setMode("tour")} aria-pressed={mode === "tour"} className={`rounded-md px-2 py-2 text-[11px] font-medium ${mode === "tour" ? "bg-panel-alt text-cyan" : "text-ink-dim hover:text-ink"}`}>
              {text.tour}
            </button>
            <button type="button" onClick={() => { setMode("chat"); setMessages((existing) => existing.length ? existing : [{ role: "assistant", content: text.greeting }]); }} aria-pressed={mode === "chat"} className={`rounded-md px-2 py-2 text-[11px] font-medium ${mode === "chat" ? "bg-panel-alt text-cyan" : "text-ink-dim hover:text-ink"}`}>
              {text.chat}
            </button>
          </div>

          {mode === "tour" ? (
            <div className="overflow-y-auto p-4">
              <div className="mb-4 flex items-center justify-between font-mono text-[10px] text-ink-faint">
                <span>{text.step} {stepIndex + 1} {text.of} {text.steps.length}</span>
                <span>{String(stepIndex + 1).padStart(2, "0")} / {String(text.steps.length).padStart(2, "0")}</span>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-panel-alt">
                <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${((stepIndex + 1) / text.steps.length) * 100}%` }} />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold">{currentStep.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-dim">{currentStep.detail}</p>
              <button type="button" onClick={() => router.push(currentStep.href)} className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-cyan hover:underline">
                {text.openPage}<span aria-hidden="true">↗</span>
              </button>
              <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-3">
                <button type="button" disabled={stepIndex === 0} onClick={() => moveTour(stepIndex - 1)} className="rounded-md border border-line px-3 py-2 text-[11px] text-ink-dim disabled:opacity-40">{text.previous}</button>
                <button type="button" onClick={() => moveTour(stepIndex + 1)} className="rounded-md bg-cyan px-3 py-2 text-[11px] font-semibold text-base hover:opacity-90">
                  {stepIndex === text.steps.length - 1 ? text.finish : text.next}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-[220px] flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite" role="log">
                {messages.map((message, index) => (
                  <div key={`${index}-${message.role}`} className={`max-w-[90%] rounded-md px-3 py-2 text-[12px] leading-5 ${message.role === "user" ? "ml-auto bg-cyan-dim text-ink" : "bg-panel-alt text-ink-dim"}`}>
                    {message.content}
                  </div>
                ))}
                {sending && <div className="text-[11px] text-ink-faint">{text.thinking}</div>}
                <div ref={endOfChatRef} />
              </div>
              <form onSubmit={sendMessage} className="border-t border-line-soft p-3">
                <label htmlFor="help-question" className="sr-only">{text.question}</label>
                <div className="flex items-center gap-2">
                  <input id="help-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder={text.placeholder} className="min-w-0 flex-1 rounded-md border border-line bg-base px-3 py-2 text-[12px] text-ink placeholder:text-ink-faint focus:border-cyan focus:outline-none" />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label={text.send} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan text-base disabled:opacity-40">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6" /></svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-label={text.help}
        className="fixed bottom-4 right-3 z-[70] flex h-12 items-center gap-2 rounded-md border border-cyan/40 bg-panel px-4 text-[12px] font-semibold text-cyan shadow-lg transition hover:border-cyan md:right-6"
      >
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="7.5" /><path d="M7.8 7.5a2.3 2.3 0 1 1 3.7 1.8c-1 .7-1.5 1.1-1.5 2.2M10 14.5v.1" /></svg>
        {text.help}
      </button>
    </>
  );
}
