import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 自定义主题颜色
        primary: {
          50: '#f0f9e8',
          100: '#e0f2d1',
          200: '#c7e8a8',
          300: '#a0d676',
          400: '#7cbf52',
          500: '#5c9d52', // 主色调
          600: '#4a7d42',
          700: '#3a5f33',
          800: '#2c4426',
          900: '#1e3432', // 深色背景
          950: '#0f1a19',
        },
        // Light主题背景色
        background: {
          DEFAULT: '#fff7e3',
          50: '#fffdf7',
          100: '#fefcef',
          200: '#fef6d1',
          300: '#fee9b3',
          400: '#fdd995',
          500: '#fcc877',
          600: '#fbb659',
          700: '#faa43b',
          800: '#f9911d',
          900: '#f87e00',
        },
        // 深色主题背景
        dark: {
          bg: '#1e3432',
          card: '#0f1a19',
          border: '#2c4426',
        },
        // 卡片背景
        card: {
          DEFAULT: '#ffffff',
          dark: '#0f1a19',
        },
        // 文字颜色
        text: {
          primary: '#5c9d52',
          secondary: '#6b7280',
          muted: '#9ca3af',
          inverse: '#ffffff',
        },
      },
      backgroundColor: {
        primary: {
          DEFAULT: '#5c9d52',
          light: '#a0d676',
          dark: '#3a5f33',
        },
      },
    },
  },
  plugins: [],
};

export default config;
