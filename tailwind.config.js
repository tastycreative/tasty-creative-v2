/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Crucial for next-themes to control dark mode
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Added pages just in case
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // If there were previous theme extensions, they would be re-added here.
      // For now, assuming default extensions are sufficient.
    },
  },
  plugins: [
    // If there were previous plugins, they would be re-added here.
  ],
};
