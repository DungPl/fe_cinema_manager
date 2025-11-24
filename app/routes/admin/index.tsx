import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Building2, Store, DoorOpen, Film, Users, Calendar,
  Ticket, DollarSign, TrendingUp, Clock,
  Popcorn
} from "lucide-react"
// import { useLoaderData } from "react-router-dom"
import { authStore } from "~/stores/authStore"
import { formatCurrency, formatNumber } from "~/lib/utils"
// import { Sidebar } from "~/components/layouts/Sidebar" // ← import Sidebar
// import { Navbar } from "~/components/layouts/Navbar"

import { getAdminStats } from "~/lib/api/statisticApi"
import { useEffect, useState } from "react"
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchStats()
  }, [])

  if (!stats) return <p className="p-8">Đang tải dữ liệu...</p>


  const statCards = [
    {
      title: "Doanh thu hôm nay",
      value: formatCurrency(stats.todayRevenue),
      growth: stats.revenueGrowth,
      icon: DollarSign,
      text: "text-green-700", // Màu xanh đậm hơn
      bg: "bg-green-200", // Màu nền sáng hơn
      border: "border-green-300", // Biên màu xanh đậm hơn
    },
    {
      title: "Vé bán hôm nay",
      value: formatNumber(stats.todayTickets),
      growth: stats.ticketsGrowth,
      icon: Ticket,
      text: "text-blue-700", // Màu xanh đậm hơn
      bg: "bg-blue-200", // Màu nền sáng hơn
      border: "border-blue-300", // Biên màu xanh đậm hơn
    },
    {
      title: "Suất chiếu sắp tới (24h)",
      value: formatNumber(stats.upcomingShows),
      growth: stats.showsGrowth,
      icon: Calendar,
      text: "text-purple-700", // Màu tím đậm hơn
      bg: "bg-purple-200", // Màu nền sáng hơn
      border: "border-purple-300", // Biên màu tím đậm hơn
    },
    {
      title: "Tăng trưởng trung bình",
      value: `${((stats.revenueGrowth + stats.ticketsGrowth + stats.showsGrowth) / 3).toFixed(1)}%`,
      growth: (stats.revenueGrowth + stats.ticketsGrowth + stats.showsGrowth) / 3,
      icon: TrendingUp,
      text: "text-orange-700", // Màu cam đậm hơn
      bg: "bg-orange-200", // Màu nền sáng hơn
      border: "border-orange-300", // Biên màu cam đậm hơn
    },
  ]

  const { user } = authStore.getState()

  const menuCards = [
  {
    title: "Chuỗi rạp",
    icon: Building2,
    to: "/admin/cinema-chains",
    count: stats.chains,
    gradient: "from-emerald-500 to-teal-600",
    iconColor: "text-emerald-500",
    textColor: "text-emerald-600",
  },
  {
    title: "Rạp chiếu",
    icon: Store,
    to: "/admin/cinemas",
    count: stats.cinemas,
    gradient: "from-blue-500 to-cyan-600",
    iconColor: "text-blue-500",
    textColor: "text-blue-600",
  },
  {
    title: "Phòng chiếu",
    icon: DoorOpen,
    to: "/admin/rooms",
    count: stats.rooms,
    gradient: "from-purple-500 to-pink-600",
    iconColor: "text-purple-500",
    textColor: "text-purple-600",
  },
  {
    title: "Phim",
    icon: Film,
    to: "/admin/movies",
    count: stats.movies,
    gradient: "from-orange-500 to-red-600",
    iconColor: "text-orange-500",
    textColor: "text-orange-600",
  },
  {
    title: "Khách hàng",
    icon: Users,
    to: "/admin/users",
    count: stats.customers, // ✔ ĐÃ SỬA
    gradient: "from-indigo-500 to-purple-600",
    iconColor: "text-indigo-500",
    textColor: "text-indigo-600",
  },
  {
    title: "Lịch chiếu",
    icon: Calendar,
    to: "/admin/schedules",
    count: stats.upcomingShows,
    gradient: "from-pink-500 to-rose-600",
    iconColor: "text-pink-500",
    textColor: "text-pink-600",
  },
]

  return (
    <div className="flex h-screen bg-gray-100">


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng quay lại, <span className="text-primary">{user?.username || "Admin"}</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Cập nhật lúc: {new Date().toLocaleString("vi-VN")}
          </p>
        </div>


        {/* Small Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const isPositive = card.growth > 0;
            const isZero = card.growth === 0;

            return (
              <Card
                key={card.title}
                className={`hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 ${card.border} ${card.bg} rounded-lg`}
              >
                <CardHeader className={`flex flex-row items-center justify-between pb-2 rounded-t-lg`}>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`w-6 h-6 ${card.text}`} />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {card.value}
                  </div>
                  <div className="flex items-center mt-3 text-sm">
                    <span className={`flex items-center font-semibold ${isPositive ? "text-green-600" : card.growth < 0 ? "text-red-600" : "text-gray-500"}`}>
                      {isPositive ? "Up" : card.growth < 0 ? "Down" : "Flat"} {Math.abs(card.growth).toFixed(1)}%
                    </span>
                    <span className="text-gray-500 ml-2">so với hôm qua</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuCards.map((item) => (
          <Link to={item.to} key={item.title}>
            <Card className="group p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-gray-300 relative overflow-hidden bg-white">
              {/* Gradient nền khi hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

              <CardContent className="flex items-center space-x-5 relative z-10">
                <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
                  <item.icon className={`h-10 w-10 ${item.iconColor} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-700 text-sm">{item.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {item.count}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Phim hot tuần này</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">1. Deadpool & Wolverine - 2.8 tỷ</p>
              <p className="text-sm text-muted-foreground">2. Inside Out 2 - 2.1 tỷ</p>
              <p className="text-sm text-muted-foreground">3. Despicable Me 4 - 1.9 tỷ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rạp đông nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">CGV Vincom Mega Mall</p>
              <p className="text-sm text-muted-foreground">1,284 vé / 12 suất</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông báo hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Phiên bản 3.2.0 đã được cập nhật</p>
              <p className="text-sm text-green-600">Tất cả hệ thống hoạt động bình thường</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}