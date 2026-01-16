// src/components/layouts/Navbar.tsx

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { User, LogOut, Sun, Moon } from "lucide-react"
import classNames from "classnames"

import { useAuthStore } from "~/stores/authAccountStore"
import { useThemeStore } from "~/stores/themeStore"

export function Navbar() {
  const navigate = useNavigate()
  const { account, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const [openUserMenu, setOpenUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isDark = theme === "dark"

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/admin/login")
  }

  return (
    <header
      className={classNames(
        "w-full h-14 flex items-center justify-end px-4 border-b z-40",
        {
          "bg-white border-gray-200 text-gray-800": !isDark,
          "bg-gray-900 border-gray-800 text-gray-100": isDark,
        }
      )}
    >
      {/* RIGHT */}
      <div className="relative flex items-center gap-2" ref={menuRef}>
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User */}
        <button
          onClick={() => setOpenUserMenu(!openUserMenu)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <img
            src="/avatar.png"
            className="w-8 h-8 rounded-full"
            alt="avatar"
          />
          <span className="hidden md:block text-sm font-medium">
            {account?.username}
          </span>
        </button>

        {openUserMenu && (
          <div
            className={classNames(
              "absolute right-0 top-12 w-48 rounded shadow border",
              {
                "bg-white border-gray-200": !isDark,
                "bg-gray-900 border-gray-800": isDark,
              }
            )}
          >
            <div className="px-4 py-2 text-xs text-gray-500 border-b dark:border-gray-700">
              {account?.role}
            </div>

            <Link
              to="/admin/profile"
              onClick={() => setOpenUserMenu(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User size={16} />
              Hồ sơ
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  )
}