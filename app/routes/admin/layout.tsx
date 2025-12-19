
import { Outlet } from "react-router-dom"
import { Sidebar } from "~/components/layouts/Sidebar"
import { Navbar } from "~/components/layouts/Navbar"
import { useState } from "react"

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar className="shrink-0 w-64 h-screen" />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          <section className="content">
            <div className="container-fluid">
              <Outlet />
            </div>
          </section>
        </div>
      </div>

      <footer className="main-footer">
        <strong>Copyright © 2025 <a href="#">CinemaPro</a>.</strong> All rights reserved.
      </footer>
    </div>

  )
}