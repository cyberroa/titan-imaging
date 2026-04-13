import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#000000",
          raised: "#111111",
          card: "#0a0a0a",
          muted: "#1e1e1e",
        },
        accent: {
          DEFAULT: "#00ffd5",
          titanium: "#a9b4c2",
        },
        text: {
          primary: "#ffffff",
          secondary: "#bbbbbb",
          muted: "#777777",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
