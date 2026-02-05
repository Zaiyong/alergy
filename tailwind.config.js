/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'tomato-red': '#FF4D2D',
        'sunny-mustard': '#FFC30B',
        'creamy-white': '#FFF8F0',
      },
      borderRadius: {
        'doughy': '24px',
        'doughy-lg': '32px',
      },
      fontFamily: {
        'playful': ['System'],
      },
    },
  },
  plugins: [],
};
