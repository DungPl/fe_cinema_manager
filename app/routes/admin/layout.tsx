
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
        <Sidebar className="flex-shrink-0 w-64 h-screen" />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {/* <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="m-0">Dashboard</h1>
                </div>
                <div className="col-sm-6">
                  <ol className="breadcrumb float-sm-right">
                    <li className="breadcrumb-item"><a href="/admin">Home</a></li>
                    <li className="breadcrumb-item active">Dashboard</li>
                  </ol>
                </div>
              </div>
            </div>
          </section> */}

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