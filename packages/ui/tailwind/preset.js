const defaultColours = require("tailwindcss/colors");

// @ts-check
/** @type {Partial<import("tailwindcss").Config>} */
module.exports = {
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    fontFamily: {
      sans: '"Hanken Grotesk", sans-serif',
      mono: '"Reddit Mono", monospace',
    },
    extend: {
      colors: {
        main: defaultColours.stone,
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
