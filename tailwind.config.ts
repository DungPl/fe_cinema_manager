// tailwind.config.ts
import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate" // ✅ import theo kiểu ESM (chuẩn hơn với TypeScript)

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",
        popover: "rgb(var(--popover))",
        "popover-foreground": "rgb(var(--popover-foreground))",
        primary: '#0069d9', // AdminLTE3 default blue
        'primary-hover': '#0056b3',
        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",
        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",
        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",
        destructive: "rgb(var(--destructive))",
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        sidebar: "rgb(var(--sidebar))",
        "sidebar-foreground": "rgb(var(--sidebar-foreground))",
        "sidebar-primary": "rgb(var(--sidebar-primary))",
        "sidebar-primary-foreground": "rgb(var(--sidebar-primary-foreground))",
        "sidebar-accent": "rgb(var(--sidebar-accent))",
        "sidebar-accent-foreground": "rgb(var(--sidebar-accent-foreground))",
        "sidebar-border": "rgb(var(--sidebar-border))",
        "sidebar-ring": "rgb(var(--sidebar-ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate], // 👈 Dùng import animate (thay vì require)
}

export default config
