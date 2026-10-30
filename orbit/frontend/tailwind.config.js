/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Reporbit palette: tangerine #fe8500 + charcoal #21232e.
        // indigo/violet/purple are remapped so every existing accent in the app becomes on-brand.
        tangerine: { 50: "#fff6eb", 100: "#ffe8cc", 200: "#ffcf99", 300: "#ffb15c", 400: "#ff9a2e", 500: "#fe8500", 600: "#e07400", 700: "#b35c00", 800: "#8a4700", 900: "#663500", 950: "#3a1e00" },
        charcoal: { 50: "#f4f5f8", 100: "#e6e8ef", 200: "#c9ccd9", 300: "#a0a5b8", 400: "#737a92", 500: "#555b72", 600: "#40455a", 700: "#33374a", 800: "#2a2d3c", 900: "#21232e", 950: "#16171f" },
        indigo: { 50: "#fff6eb", 100: "#ffe8cc", 200: "#ffcf99", 300: "#ffb15c", 400: "#ff9a2e", 500: "#fe8500", 600: "#f07d00", 700: "#b35c00", 800: "#8a4700", 900: "#663500", 950: "#3a1e00" },
        violet: { 50: "#fff4ed", 100: "#ffe4d1", 200: "#ffc5a1", 300: "#ffa06a", 400: "#ff7d3d", 500: "#ff6a1f", 600: "#f05a0f", 700: "#c2450a", 800: "#99360c", 900: "#7a2e0e", 950: "#421405" },
        purple: { 50: "#fff1f3", 100: "#ffe0e6", 200: "#ffc2cf", 300: "#ff93a9", 400: "#ff5d7e", 500: "#ff3b66", 600: "#ed1d52", 700: "#c81145", 800: "#a71241", 900: "#8e133e", 950: "#50041d" },
        space: {
          950: "#16171f",
          900: "#1b1d27",
          850: "#1e202a",
          800: "#21232e",
          700: "#2c2f3d",
          600: "#3b3f52",
        },
        orbit: {
          purple: "#6366f1",
          violet: "#8b5cf6",
          blue: "#3b82f6",
          cyan: "#06b6d4",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "ui-monospace",
          "Menlo",
          "monospace"
        ]
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "blob": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.1)" },
          "66%": { transform: "translate(-30px,25px) scale(0.95)" },
        },
        "shine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "star-twinkle": {
          "0%, 100%": { opacity: 0.2, transform: "scale(0.8)" },
          "50%": { opacity: 0.9, transform: "scale(1.2)" },
        }
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "float": "float 5s ease-in-out infinite",
        "twinkle": "star-twinkle 4s ease-in-out infinite",
        "blob": "blob 18s ease-in-out infinite",
        "shine": "shine 6s linear infinite",
      }
    },
  },
  plugins: [],
}
