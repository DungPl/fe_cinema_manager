import { Outlet } from "react-router-dom"
import Navbar from "~/components/layouts/customer/Navbar"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
