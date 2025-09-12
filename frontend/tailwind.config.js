/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./index.html"
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"]
        }
      },
    },
    plugins: [],
  }
  