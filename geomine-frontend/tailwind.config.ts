import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--base) / <alpha-value>)",
        side: "rgb(var(--side) / <alpha-value>)",
        panel: {
          DEFAULT: "rgb(var(--panel) / <alpha-value>)",
          alt: "rgb(var(--panel-alt) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          soft: "rgb(var(--line-soft) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          dim: "rgb(var(--ink-dim) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--amber) / <alpha-value>)",
          dim: "rgb(var(--amber-dim) / <alpha-value>)",
        },
        green: {
          DEFAULT: "rgb(var(--green) / <alpha-value>)",
          dim: "rgb(var(--green-dim) / <alpha-value>)",
        },
        red: {
          DEFAULT: "rgb(var(--red) / <alpha-value>)",
          dim: "rgb(var(--red-dim) / <alpha-value>)",
        },
        cyan: {
          DEFAULT: "rgb(var(--cyan) / <alpha-value>)",
          dim: "rgb(var(--cyan-dim) / <alpha-value>)",
        },
        buttonInk: "rgb(var(--button-ink) / <alpha-value>)",
        status: {
          green: "rgb(var(--status-green) / <alpha-value>)",
          amber: "rgb(var(--status-amber) / <alpha-value>)",
          red: "rgb(var(--status-red) / <alpha-value>)",
          cyan: "rgb(var(--status-cyan) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      screens: {
        xs: "480px",
      },
      keyframes: {
        "dot-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "skeleton-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "dot-pulse": "dot-pulse 1.6s ease-in-out infinite",
        "skeleton-shimmer": "skeleton-shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
