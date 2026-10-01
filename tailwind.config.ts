import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        industrial: {
          orange: "#ea580c",
          black: "#09090b",
          neutral: "#f4f4f5",
          green: "#16a34a",
          red: "#dc2626",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #09090b",
        "brutal-sm": "2px 2px 0px 0px #09090b",
        "brutal-lg": "6px 6px 0px 0px #09090b",
      },
    },
  },
  plugins: [],
};
export default config;
