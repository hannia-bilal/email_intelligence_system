/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        canvas: "#F9FAFB",
        brand: { DEFAULT: "#2563EB", dark: "#1D4ED8", soft: "#EFF6FF" },
        ai: { DEFAULT: "#8B5CF6", dark: "#7C3AED", soft: "#F5F3FF" },
        ink: "#111827",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.04)",
        lift: "0 6px 18px rgba(37,99,235,0.10), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 10px 30px rgba(16,24,40,0.12)",
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { rise: "rise .45s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
