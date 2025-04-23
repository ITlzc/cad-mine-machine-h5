/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
    screens: {
      'sm': '640px',    // 手机横屏
      'md': '960px',    // 平板竖屏
      'lg': '1024px',   // 平板横屏/小屏笔记本
      'xl': '1280px',   // 桌面显示器
      '2xl': '1536px',  // 大屏显示器
      '3xl': '1920px',  // 超大屏显示器
    },
  },
  plugins: [],
} 