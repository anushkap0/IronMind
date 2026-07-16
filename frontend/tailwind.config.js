/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(var(--color-bg) / <alpha-value>)",
        panel: "rgb(var(--color-surface) / <alpha-value>)",
        panel2: "rgb(var(--color-surface-2) / <alpha-value>)",
        blood: "rgb(var(--color-accent) / <alpha-value>)",
        ember: "rgb(var(--color-accent-2) / <alpha-value>)",
        bone: "rgb(var(--color-text) / <alpha-value>)",
        steel: "rgb(var(--color-text-muted) / <alpha-value>)",
        line: "rgb(var(--color-border) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Poppins'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        pulseLine: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.55", filter: "blur(40px)" },
          "50%": { opacity: "0.9", filter: "blur(55px)" },
        },
      },
      animation: {
        pulseLine: "pulseLine 3.2s linear infinite",
        floatY: "floatY 4s ease-in-out infinite",
        glowPulse: "glowPulse 5s ease-in-out infinite",
      },
      boxShadow: {
        glowRed: "0 0 40px -5px rgba(227,27,61,0.55)",
      },
    },
  },
  plugins: [],
};
