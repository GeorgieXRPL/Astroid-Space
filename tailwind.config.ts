import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#000814',
          900: '#001233',
          800: '#001845',
          700: '#002855',
          600: '#023e7d',
          500: '#0353a4',
        },
        cosmos: {
          DEFAULT: '#00d4ff',
          50: '#e6faff',
          100: '#b3f1ff',
          200: '#80e8ff',
          300: '#4ddeff',
          400: '#1ad5ff',
          500: '#00d4ff',
          600: '#00a9cc',
          700: '#007f99',
          800: '#005466',
          900: '#002a33',
        },
        ember: {
          DEFAULT: '#ff7a45',
          50: '#fff1ec',
          100: '#ffd9c9',
          200: '#ffc1a6',
          300: '#ffa883',
          400: '#ff9061',
          500: '#ff7a45',
          600: '#cc6237',
          700: '#994929',
          800: '#66311c',
          900: '#33180e',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'drift': 'drift 60s linear infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(-100px) translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
