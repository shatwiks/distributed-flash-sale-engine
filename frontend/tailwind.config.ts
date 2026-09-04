import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        craft: {
          bg: "#120D0A",         // Charred oak / darkest base
          surface: "#1E1611",    // Walnut panel backing
          card: "#2A1D17",       // Deep cedar card base
          cardHover: "#34241C",  // Slightly lifted wood
          panel: "#3D2B1F",      // Solid timber surface
          border: "#4E3727",     // Subtle joinery outline
          borderLight: "#6B4D36",// Highlighted joinery
          teak: "#8C6239",       // Polished teak
          brass: "#C5A059",      // Brushed brass accent
          brassHover: "#D6B26A", // Warm glowing brass
          parchment: "#D4B996",  // Natural parchment text
          cream: "#F5EFEB",      // Pure natural off-white
          terracotta: "#E07A5F", // Fired clay / alert
          ember: "#C8553D",      // Deep glowing ember
          moss: "#588157",       // Forest moss green
          sage: "#8FBC8F",       // Muted sage green
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        tactile: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(0, 0, 0, 0.6), 0 8px 24px -4px rgba(0, 0, 0, 0.5)",
        card: "0 12px 30px -8px rgba(0, 0, 0, 0.7), 0 4px 8px -2px rgba(0, 0, 0, 0.4)",
        brassGlow: "0 0 25px -4px rgba(197, 160, 89, 0.35)",
        emberGlow: "0 0 25px -4px rgba(224, 122, 95, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
