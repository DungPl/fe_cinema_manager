// app/routes/(public)/index.tsx
import { redirect } from "react-router"

export function loader() {
  return { message: "Welcome to Cinema Manager" }
}({})

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
          Cinema Manager
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Quản lý rạp chiếu phim hiện đại, dễ dàng, hiệu quả.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Bắt đầu ngay
          </button>
          <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Xem demo
          </button>
        </div>
      </div>
    </div>
  )
}