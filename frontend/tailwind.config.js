/** @type {import('tailwindcss').Config} */
export default {
  // JSON is included because lesson theory HTML (src/data/*.json) carries Tailwind classes.
  content: ["./index.html", "./src/**/*.{js,jsx,json}"],
  theme: { extend: {} },
  plugins: [],
};
