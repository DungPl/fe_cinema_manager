import { create } from "zustand"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as Theme) || "light"
  }
  return "light"
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light"

      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme)
        document.documentElement.classList.toggle("dark", newTheme === "dark")
      }

      return { theme: newTheme }
    }),
  setTheme: (t) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", t)
      document.documentElement.classList.toggle("dark", t === "dark")
    }
    set({ theme: t })
  },
}))
