import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0a0b0f",
          900: "#121319",
          850: "#171923",
          800: "#1d2029",
          700: "#272b38",
          600: "#3a3f52",
          500: "#565c74",
          400: "#7d84a0",
          300: "#a8adc4",
          200: "#d3d6e3",
        },
        accent: {
          DEFAULT: "#5b8cff",
          soft: "#5b8cff33",
        },
        state: {
          established: "#3ddc84",
          listen: "#5b9dff",
          timewait: "#f5c451",
          closing: "#ff6b6b",
          idle: "#7d84a0",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        panel: "0 8px 30px rgba(0,0,0,0.35)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
