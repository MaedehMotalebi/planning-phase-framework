/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    {
      pattern:
        /(bg|text|border)-(yellow|blue|green|purple|amber|emerald|sky|indigo|gray)-(50|100|200|300|500|600|700|800)/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
