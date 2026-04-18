import type { Config } from "tailwindcss";

const config: Config = {
 content: [
 "./app/**/*.{js,ts,jsx,tsx,mdx}",
 "./components/**/*.{js,ts,jsx,tsx,mdx}",
 ],
 theme: {
 extend: {
 colors: {
 // Warm off-white base — never use pure white.
 canvas: {
 DEFAULT: "#F6F3EE", // primary background
 50: "#FBF8F4", // elevated surface
 100: "#F6F3EE",
 200: "#F1ECE5", // secondary background
 300: "#E8E2D8", // hover / pressed
 },
 // Deep contrast surfaces — for /pro and premium panels.
 graphite: {
 DEFAULT: "#1B1D22",
 600: "#242831", // soft dark UI surface
 700: "#1B1D22",
 800: "#141619",
 900: "#0C0D10",
 },
 // Text system.
 ink: {
 DEFAULT: "#17181C", // primary text
 600: "#5E6470", // secondary
 500: "#7B8190", // muted
 400: "#9BA1AE",
 },
 // Accent system — restrained, intelligent.
 sand: {
 DEFAULT: "#D8B98A", // futuristic sand-gold
 light: "#E6CEA6",
 dark: "#B89A6C",
 },
 clay: {
 DEFAULT: "#CBB69A", // muted clay-beige
 },
 slate: {
 smart: "#7C90B0", // smart cool slate-blue
 },
 mint: {
 DEFAULT: "#B8D8C8", // "AI active" luminous mint
 glow: "#C8E4D4",
 },
 },
 fontFamily: {
 display: ['"Fraunces"', 'Georgia', 'serif'],
 sans: ['"Geist Sans"', '"Inter"', 'system-ui', 'sans-serif'],
 mono: ['"JetBrains Mono"', '"Geist Mono"', 'monospace'],
 },
 borderRadius: {
 xl: "20px",
 "2xl": "24px",
 "3xl": "28px",
 },
 borderColor: {
 hairline: "rgba(23,24,28,0.08)",
 panel: "rgba(23,24,28,0.12)",
 "hairline-dark": "rgba(255,255,255,0.06)",
 "panel-dark": "rgba(255,255,255,0.10)",
 },
 boxShadow: {
 soft: "0 1px 2px rgba(23,24,28,0.04), 0 8px 24px rgba(23,24,28,0.06)",
 lift: "0 4px 16px rgba(23,24,28,0.06), 0 24px 48px rgba(23,24,28,0.08)",
 glow: "0 0 40px rgba(216,185,138,0.25)",
 "glow-mint": "0 0 40px rgba(184,216,200,0.35)",
 "inner-soft": "inset 0 1px 0 rgba(255,255,255,0.6)",
 },
 backgroundImage: {
 "grain": "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><filter id=\"n\"><feTurbulence baseFrequency=\"0.85\" numOctaves=\"2\"/><feColorMatrix values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\"/></svg>')",
 "blueprint": "linear-gradient(rgba(124,144,176,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,144,176,0.06) 1px, transparent 1px)",
 "blueprint-dark": "linear-gradient(rgba(124,144,176,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,144,176,0.08) 1px, transparent 1px)",
 "radial-warm": "radial-gradient(ellipse at top, rgba(216,185,138,0.15), transparent 60%)",
 "radial-cool": "radial-gradient(ellipse at top, rgba(124,144,176,0.12), transparent 60%)",
 },
 keyframes: {
 "scan-sweep": {
 "0%": { top: "0%", opacity: "0" },
 "10%": { opacity: "1" },
 "90%": { opacity: "1" },
 "100%": { top: "100%", opacity: "0" },
 },
 "float": {
 "0%, 100%": { transform: "translateY(0)" },
 "50%": { transform: "translateY(-6px)" },
 },
 "pulse-soft": {
 "0%, 100%": { opacity: "0.6" },
 "50%": { opacity: "1" },
 },
 "reveal-up": {
 "0%": { opacity: "0", transform: "translateY(12px)" },
 "100%": { opacity: "1", transform: "translateY(0)" },
 },
 "shimmer": {
 "0%": { backgroundPosition: "-200% 0" },
 "100%": { backgroundPosition: "200% 0" },
 },
 },
 animation: {
 "scan-sweep": "scan-sweep 2.4s ease-in-out infinite",
 "float": "float 5s ease-in-out infinite",
 "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
 "reveal-up": "reveal-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
 "shimmer": "shimmer 2.4s linear infinite",
 },
 },
 },
 plugins: [],
};

export default config;
