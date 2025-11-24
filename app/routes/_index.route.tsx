// src/app/routes/_index.route.tsx
import { Link } from "react-router-dom"
import { Button } from "..//components/ui/button"
import { Film, LogIn, Ticket } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:to-black px-4">
      <Film className="h-24 w-24 text-primary mb-8 animate-pulse" />
      <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 mb-4">
        CinemaPro
      </h1>
      <p className="text-xl text-muted-foreground mb-10 text-center max-w-2xl">
        Hệ thống quản lý rạp chiếu phim hiện đại – Đặt vé, quản lý lịch chiếu, bán vé nhanh chóng
      </p>
      <div className="flex gap-6">
        <Button  size="lg" className="shadow-xl">
          <Link to="/auth/login">
            <LogIn className="mr-2 h-5 w-5" />
            Đăng nhập
          </Link>
        </Button>
        <Button size="lg" variant="outline">
          <Link to="/public/movies">
            <Ticket className="mr-2 h-5 w-5" />
            Xem phim đang chiếu
          </Link>
        </Button>
      </div>
    </div>
  )
}