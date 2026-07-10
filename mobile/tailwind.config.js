/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode palette
        sage: {
          50:  "#FBE8CE",
          100: "#E4DFB5",
          200: "#C3CC9B",
          400: "#9AB17A",
          600: "#7A9460",
          800: "#5C7045",
        },
        // Dark mode palette
        forest: {
          900: "#1B211A",
          700: "#28321F",
          600: "#628141",
          400: "#8BAE66",
        },
        sand: "#EBD5AB",
      },
    },
  },
  plugins: [],
};
