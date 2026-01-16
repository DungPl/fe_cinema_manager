// src/app/components/layout/MainLayout.tsx
import { Outlet } from "react-router"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />   {/* DUY NHẤT, KHÔNG BỊ SLOT WRAP → AN TOÀN 100% */}
      </main>
      <Footer />
    </div>
  )
}