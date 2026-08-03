/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17231c",
        paper: "#f7f5ef",
        fern: "#2b6655",
        coral: "#d9583d",
        mapblue: "#387bc6",
        moss: "#e4eee5",
      },
      fontFamily: {
        display: ["IBM Plex Sans Thai", "IBM Plex Sans", "sans-serif"],
        sans: ["IBM Plex Sans Thai", "IBM Plex Sans", "Aptos", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        float: "0 18px 50px rgba(27, 35, 31, 0.14)",
        soft: "0 10px 24px rgba(27, 35, 31, 0.1)",
      },
    },
  },
  plugins: [],
};
