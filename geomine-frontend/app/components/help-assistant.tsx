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
    placeholder: "Ask about readings, generators, reports…",
    send: "Send",
    thinking: "Thinking…",
    greeting: "Hi. Ask me how to use this page or find a workflow.",
    unavailable: "I couldn't reach the guide right now. Please try again.",
    steps: [
      { title: "Fleet overview", detail: "Start here to scan generator health, recent readings, and issues needing attention.", href: "/dashboard" },
      { title: "Generators", detail: "Browse generators and open one to inspect its readings and health history.", href: "/machines" },
      { title: "Log a reading", detail: "Choose a generator and parameter, enter the measured value and time, then submit.", href: "/entry" },
      { title: "Reading history", detail: "Review readings you have submitted and check their recorded values.", href: "/entry/history" },
      { title: "Reports", detail: "Choose a generator and date range to review and export a CSV report.", href: "/reports" },
      { title: "Add a generator", detail: "Administrators can register a generator with its name, site, and electrical phase.", href: "/machines/new" },
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
    placeholder: "Uliza kuhusu vipimo, jenereta, ripoti…",
    send: "Tuma",
    thinking: "Inatafuta…",
    greeting: "Hujambo. Uliza jinsi ya kutumia ukurasa huu au kupata hatua za kazi.",
    unavailable: "Sikuweza kuwasiliana na mwongozo. Tafadhali jaribu tena.",
    steps: [
      { title: "Muhtasari wa mtambo", detail: "Anza hapa kuona afya ya jenereta, vipimo vya hivi karibuni, na matatizo yanayohitaji uangalizi.", href: "/dashboard" },
      { title: "Jenereta", detail: "Tazama jenereta na ufungue moja kukagua vipimo na historia ya afya.", href: "/machines" },
      { title: "Rekodi kipimo", detail: "Chagua jenereta na kipengele, weka thamani iliyopimwa na muda, kisha tuma.", href: "/entry" },
      { title: "Historia ya vipimo", detail: "Kagua vipimo ulivyotuma na uhakikishe thamani zilizorekodiwa.", href: "/entry/history" },
      { title: "Ripoti", detail: "Chagua jenereta na kipindi ili kukagua na kupakua ripoti ya CSV.", href: "/reports" },
      { title: "Ongeza jenereta", detail: "Wasimamizi wanaweza kusajili jenereta kwa kuweka jina, eneo na awamu ya umeme.", href: "/machines/new" },
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
