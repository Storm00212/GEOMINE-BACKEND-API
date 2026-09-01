import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#181B21",
        side: "#14161B",
        panel: { DEFAULT: "#21252D", alt: "#282D37" },
        line: { DEFAULT: "#363C48", soft: "#2C313C" },
        ink: { DEFAULT: "#EDEFF3", dim: "#8D95A3", faint: "#5C6270" },
        amber: { DEFAULT: "#E8A33D", dim: "#4A3B22" },
        green: { DEFAULT: "#4FAE7C", dim: "#22392E" },
        red: { DEFAULT: "#E0574F", dim: "#402323" },
        cyan: { DEFAULT: "#4FC3D9", dim: "#1E3438" },
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
      },
      animation: {
        "dot-pulse": "dot-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
