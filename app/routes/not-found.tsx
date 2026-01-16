// app/routes/not-found.tsx
import { Link } from "react-router"
import { Button } from "..//components/ui/button"
import { useTranslation } from "react-i18next"
import { MapPin, ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="text-center space-y-6 max-w-lg animate-in fade-in slide-in-from-top-4 duration-700">
        {/* 404 Icon */}
        <div className="relative inline-block">
          <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">
            404
          </div>
          <MapPin className="absolute -top-4 -right-4 w-12 h-12 text-red-500 animate-pulse" />
        </div>

        {/* Tiêu đề */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {t("notfound.title", "Oops! Trang không tồn tại")}
        </h1>

        {/* Mô tả vui */}
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("notfound.message", "Có vẻ như bạn đã đi lạc vào một suất chiếu không có thật. Hãy quay lại rạp chính nhé!")}
        </p>

        {/* Nút */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button size="lg" className="shadow-lg">
            <Link to="/">
              <Home className="w-5 h-5 mr-2" />
              {t("notfound.home", "Về trang chủ")}
            </Link>
          </Button>

          <Button variant="secondary" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("notfound.back", "Quay lại")}
          </Button>
        </div>

        {/* Gợi ý */}
        <div className="mt-10 p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("notfound.tip", "Mẹo: Kiểm tra URL hoặc dùng thanh tìm kiếm để tìm phim yêu thích!")}
          </p>
        </div>
      </div>
    </div>
  )
}