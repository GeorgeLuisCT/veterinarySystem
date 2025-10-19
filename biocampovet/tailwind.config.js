/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {},
    },
    plugins: [],
    safelist: [
      { pattern: /bg-(blue|orange|pink|yellow|amber|sky|green|stone|gray|slate|lime|rose)-(400|500|600|700)/ },
      "bg-black",
    ],
  };
  