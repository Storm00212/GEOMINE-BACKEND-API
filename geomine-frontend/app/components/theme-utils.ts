export type StatusTone = "green" | "amber" | "red" | "cyan" | "neutral";

export const TONE_TEXT: Record<StatusTone, string> = {
  green: "text-green",
  amber: "text-amber",
  red: "text-red",
  cyan: "text-cyan",
  neutral: "text-ink",
};

export const TONE_DOT: Record<StatusTone, string> = {
  green: "gm-dot green",
  amber: "gm-dot amber",
  red: "gm-dot red",
  cyan: "gm-dot green",
  neutral: "gm-dot green",
};

export function statusFromHealth(health: number | null | undefined): StatusTone {
  if (health === null || health === undefined) return "neutral";
  if (health >= 80) return "green";
  if (health >= 55) return "amber";
  return "red";
}
