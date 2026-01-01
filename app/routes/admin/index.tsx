// routes/admin/index.tsx
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Building2, Store, DoorOpen, Film, Users, Calendar,
  Ticket, DollarSign, TrendingUp, Clock, Popcorn
} from "lucide-react"
import { useAuthStore } from "~/stores/authAccountStore"
import { cn, formatCurrency, formatNumber } from "~/lib/utils"
import { getAdminStats } from "~/lib/api/statisticApi"
import { toast } from "sonner"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { account, isManager } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Manager → redirect sang trang rạp của họ
    if (isManager && account?.cinemaId) {
      navigate(`/admin/cinemas/${account.cinemaId}`)
      return // Không load dashboard chung
    }

    // Admin → load stats chung
    const fetchStats = async () => {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch (err) {
        toast.error("Lỗi tải dữ liệu dashboard")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [isManager, account?.cinemaId, navigate])

  if (isManager && account?.cinemaId) {
    return null // Đang redirect → không render gì
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>

  if (!stats) return <div className="p-8 text-center text-red-500">Không thể tải dữ liệu</div>

  const statCards = [
    {
      title: "Doanh thu hôm nay",
      value: formatCurrency(stats.todayRevenue),
      growth: stats.revenueGrowth,
      icon: DollarSign,
      text: "text-green-700",
      bg: "bg-green-200",
      border: "border-green-300",
    },
    {
      title: "Vé bán hôm nay",
      value: formatNumber(stats.todayTickets),
      growth: stats.ticketsGrowth,
      icon: Ticket,
      text: "text-blue-700",
      bg: "bg-blue-200",
      border: "border-blue-300",
    },
    {
      title: "Suất chiếu sắp tới (24h)",
      value: formatNumber(stats.upcomingShows),
      growth: stats.showsGrowth,
      icon: Calendar,
      text: "text-purple-700",
      bg: "bg-purple-200",
      border: "border-purple-300",
    },
    {
      title: "Tăng trưởng trung bình",
      value: `${((stats.revenueGrowth + stats.ticketsGrowth + stats.showsGrowth) / 3).toFixed(1)}%`,
      growth: (stats.revenueGrowth + stats.ticketsGrowth + stats.showsGrowth) / 3,
      icon: TrendingUp,
      text: "text-orange-700",
      bg: "bg-orange-200",
      border: "border-orange-300",
    },
  ]

  const menuCards = [
    // Chỉ ADMIN thấy chuỗi rạp & danh sách rạp tổng
    {
      title: "Chuỗi rạp",
      icon: Building2,
      to: "/admin/cinema-chains",
      count: stats.chains,
      gradient: "from-emerald-500 to-teal-600",
      iconColor: "text-emerald-500",
      textColor: "text-emerald-600",
      visible: !isManager,
    },
    {
      title: "Rạp chiếu",
      icon: Store,
      to: "/admin/cinemas",
      count: stats.cinemas,
      gradient: "from-blue-500 to-cyan-600",
      iconColor: "text-blue-500",
      textColor: "text-blue-600",
      visible: !isManager,
    },
    // Phòng chiếu: Manager link đến rạp của mình
    {
      title: "Phòng chiếu",
      icon: DoorOpen,
      to: isManager && account?.cinemaId ? `/admin/cinemas/${account.cinemaId}/rooms` : undefined,
      count: stats.rooms,
      gradient: "from-purple-500 to-pink-600",
      iconColor: "text-purple-500",
      textColor: "text-purple-600",
      visible: true,
      // Nếu to === undefined → Link sẽ không hoạt động (không clickable)
    },
    {
      title: "Phim",
      icon: Film,
      to: "/admin/movie",
      count: stats.movies,
      gradient: "from-orange-500 to-red-600",
      iconColor: "text-orange-500",
      textColor: "text-orange-600",
      visible: !isManager,
    },
    {
      title: "Khách hàng",
      icon: Users,
      to: "/admin/users",
      count: stats.customers,
      gradient: "from-indigo-500 to-purple-600",
      iconColor: "text-indigo-500",
      textColor: "text-indigo-600",
      visible: !isManager,
    },
    {
      title: "Lịch chiếu",
      icon: Calendar,
      to: isManager && account?.cinemaId
        ? `/admin/showtime?cinemaId=${account.cinemaId}`
        : "/admin/showtime",
      count: stats.upcomingShows,
      gradient: "from-pink-500 to-rose-600",
      iconColor: "text-pink-500",
      textColor: "text-pink-600",
      visible: true,
    },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng quay lại, <span className="text-primary">{account?.username || "Admin"}</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Cập nhật lúc: {new Date().toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Small Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const isPositive = card.growth > 0
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
            )
          })}
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuCards
            .filter(item => item.visible)
            .map((item) => {
              const isClickable = !!item.to // Có link → clickable

              const cardContent = (
                <Card
                  className={cn(
                    "group p-6 relative overflow-hidden bg-white border-2 border-transparent",
                    // Chỉ thêm hover effect nếu clickable
                    isClickable && "hover:shadow-2xl hover:scale-105 hover:border-gray-300 cursor-pointer transition-all duration-300",
                    !isClickable && "cursor-default" // Không clickable → con trỏ mặc định
                  )}
                >
                  {/* Gradient overlay chỉ khi clickable */}
                  {isClickable && (
                    <div className={`absolute inset-0 bg-linear-to-r ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                  )}

                  <CardContent className="flex items-center space-x-5 relative z-10">
                    <div className={cn(
                      "p-3 rounded-full transition-colors",
                      isClickable ? "bg-gray-50 group-hover:bg-white" : "bg-gray-100"
                    )}>
                      <item.icon className={cn(
                        "h-10 w-10 transition-transform",
                        isClickable ? item.iconColor + " group-hover:scale-110" : item.iconColor + " opacity-80"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-700 text-sm">{item.title}</h3>
                      <p className="text-3xl font-bold text-gray-900">
                        {item.count ?? "-"}
                      </p>
                    </div>
                  </CardContent>

                  {/* Tooltip khi không clickable (chỉ Admin thấy) */}
                  {!isClickable && (
                    <div className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="text-sm text-gray-600 font-medium">Xem theo rạp</p>
                    </div>
                  )}
                </Card>
              )

              // Nếu có link → bọc Link
              // Nếu không → render card thường
              return isClickable ? (
                <Link to={item.to!} key={item.title}>
                  {cardContent}
                </Link>
              ) : (
                <div key={item.title}>
                  {cardContent}
                </div>
              )
            })}
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