/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FAFAF9",
          muted: "#F5F5F4",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        product: "0 24px 48px -12px rgba(28, 25, 23, 0.12)",
        soft: "0 1px 2px rgba(28, 25, 23, 0.06)",
      },
    },
  },
  plugins: [],
};
