// src/app/components/layouts/Navbar.tsx  ←  CẬP NHẬT MỚI NHẤT 11/11/2025 09:19

import { Link } from "react-router-dom"
import { authStore } from "~/stores/authStore"
import { Bell, MessageSquare, LogOut, User, Moon, Sun } from "lucide-react"
//import { useTheme } from "next-themes" // nếu dùng next-themes, hoặc tự viết toggle

export function Navbar() {
  const { user } = authStore.getState()
  // const { theme, setTheme } = useTheme() // bỏ comment nếu dùng next-themes

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light border-b">
      {/* Left navbar links */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" data-widget="pushmenu" href="#" role="button">
            <i className="fas fa-bars"></i>
          </a>
        </li>
        <li className="nav-item d-none d-sm-inline-block">
          <Link to="/admin" className="nav-link">Trang chủ</Link>
        </li>
        <li className="nav-item d-none d-sm-inline-block">
          <a href="#" className="nav-link">Hỗ trợ</a>
        </li>
      </ul>

      {/* Right navbar links */}
      <ul className="navbar-nav ml-auto">
        {/* Dark mode toggle */}
        <li className="nav-item">
          <button
            // onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="nav-link btn btn-link"
          >
            <Sun className="h-5 w-5 block dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
          </button>
        </li>

        {/* Messages Dropdown */}
        <li className="nav-item dropdown">
          <a className="nav-link" data-toggle="dropdown" href="#">
            <MessageSquare className="h-5 w-5" />
            <span className="badge badge-danger navbar-badge">3</span>
          </a>
          <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
            <span className="dropdown-item dropdown-header">3 Tin nhắn</span>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item">
              <i className="fas fa-envelope mr-2"></i> Khách hàng phản hồi vé
              <span className="float-right text-muted text-sm">3 phút</span>
            </a>
            {/* thêm tin nhắn... */}
          </div>
        </li>

        {/* Notifications Dropdown */}
        <li className="nav-item dropdown">
          <a className="nav-link" data-toggle="dropdown" href="#">
            <Bell className="h-5 w-5" />
            <span className="badge badge-warning navbar-badge">15</span>
          </a>
          <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
            <span className="dropdown-item dropdown-header">15 Thông báo</span>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item">
              <i className="fas fa-film mr-2"></i> Phim mới: Deadpool 3
              <span className="float-right text-muted text-sm">2 giờ</span>
            </a>
            {/* thêm thông báo... */}
          </div>
        </li>

        {/* User Dropdown */}
        <li className="nav-item dropdown">
          <a className="nav-link" data-toggle="dropdown" href="#">
            <img 
              src="/avatar.png" 
              alt="Admin" 
              className="img-circle elevation-2" 
              style={{ width: 32, height: 32 }} 
            />
          </a>
          <div className="dropdown-menu dropdown-menu-right">
            <span className="dropdown-item dropdown-header">
              {user?.username || "Admin"}
            </span>
            <div className="dropdown-divider"></div>
            <Link to="/admin/profile" className="dropdown-item">
              <User className="h-4 w-4 mr-2" />
              Hồ sơ cá nhân
            </Link>
            <div className="dropdown-divider"></div>
            <Link to="/authen/logout" className="dropdown-item text-danger">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Link>
          </div>
        </li>
      </ul>
    </nav>
  )
}