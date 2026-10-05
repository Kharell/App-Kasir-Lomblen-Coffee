import type { Config } from "tailwindcss";

/**
 * Design System "Lomblen Cofe"
 * - Netral: putih / abu-abu terang (latar), teks gelap (keterbacaan tinggi)
 * - Aksen tunggal: espresso (cokelat kopi) untuk CTA penting
 * - Min. target sentuh 44px (h-11 / w-11)
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: "#f7f4f2",
          100: "#ede4dd",
          200: "#dcc9bb",
          300: "#c5a48e",
          400: "#a97c5f",
          500: "#8f5f40",
          600: "#754a30",
          700: "#5c3a26",
          800: "#43291b",
          900: "#2b1a11",
          950: "#1a0f09",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      spacing: {
        touch: "44px", // standar minimum target sentuh
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      boxShadow: {
        // Hanya elevasi fungsional (memisahkan lapisan), tanpa glow dekoratif
        panel: "0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.10)",
        raised: "0 4px 12px -2px rgb(0 0 0 / 0.12)",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;