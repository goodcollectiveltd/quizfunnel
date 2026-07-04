/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Official Good for Pets swatch — see company-context/visual-identity.md
        brand: {
          red: "#EF3824", // Primary — hero colour, CTAs, accents
          ink: "#282C5F", // Deep navy — headings / body text
          indigo: "#545BA9", // Secondary periwinkle
          sky: "#95D8E9", // Accent sky blue
          pink: "#F8C3DA", // Accent soft pink
          cream: "#F3EDE5", // Warm cream — page backgrounds, cards
        },
      },
      fontFamily: {
        // Rounded, friendly wordmark feel; Poppins used across GFP surfaces
        sans: ["Poppins", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(40, 44, 95, 0.12)",
        cta: "0 8px 24px -6px rgba(239, 56, 36, 0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
