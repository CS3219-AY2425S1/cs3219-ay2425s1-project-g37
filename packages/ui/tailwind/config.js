// @ts-check

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./**/*.{html,js,ts,jsx,tsx}", "../../packages/ui/**/*.{ts,tsx}"],
  presets: [require("./preset")],
};
