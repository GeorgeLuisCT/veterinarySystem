/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Garantiza que estas paletas existan (especialmente orange)
      colors: {
        blue: colors.blue,
        orange: colors.orange,
        pink: colors.pink,
        yellow: colors.yellow,
        amber: colors.amber,
        sky: colors.sky,
        green: colors.green,
        stone: colors.stone,
        gray: colors.gray,
        slate: colors.slate,
        lime: colors.lime,
        rose: colors.rose,
      },
    },
  },
  plugins: [],
  safelist: [
    // Genera utilidades dinámicas para los colores y tonos que usas
    { pattern: /(bg|border|text|ring)-(blue|orange|pink|yellow|amber|sky|green|stone|gray|slate|lime|rose)-(400|500|600|700)/ },
    // Extras explícitos
    "bg-black",
    "border-black",
    "text-black",
  ],
};
