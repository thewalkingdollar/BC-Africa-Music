export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bc-blue': '#4A9FD6', // primary - buttons, glows, borders
        'bc-light': '#5AA1D2', // highlights, gradients
        'bc-steel': '#2F7AB8', // headings, secondary
        'bc-primary': '#3A8BC2', // primary button
        'bc-dark': '#0A1426', // canvas background
        'bc-surface': '#0F1D32', // canvas surface
      },
      backgroundImage: {
        'bc-hero-gradient': 'linear-gradient(135deg, #5AA1D2 0%, #2F7AB8 100%)',
      },
    },
  },
  plugins: [],
};
