// utils/useDarkMode.ts
import { useEffect, useState } from "react"

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" ||
           (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle("dark", isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

  return { isDark, toggle: () => setIsDark(prev => !prev) }
}