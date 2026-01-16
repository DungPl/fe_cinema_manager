import { useEffect, useMemo, useState } from "react"
import { addDays, endOfMonth, endOfYear, format, parse, startOfMonth, startOfYear, subDays, subMonths } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Badge } from "~/components/ui/badge"
import { Download, ArrowUpRight, ArrowDownRight, PieChart, Loader2 } from "lucide-react"
import { apiClient } from "~/lib/api/client"
import { cn, formatCurrency } from "~/lib/utils"
import { toast } from "sonner"
import { getCinemas } from "~/lib/api/cinemaApi"
import type { Cinema } from "~/lib/api/types"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, BarChart, Bar, Pie, Cell, Legend, type PieLabelRenderProps } from "recharts"
// Types từ backend
type KPI = {
    totalRevenue: number
    totalTickets: number
    avgOccupancy: number
    totalCustomers: number
    revenueChangePct: number

    ticketChangePct: number
    customerChangePct: number
    occupancyChangePct: number

    prevAvgOccupancy: number
    prevTotalCustomers: number
    prevTotalRevenue: number
    prevTotalTickets: number
}
type DailyMetric = {
    date: string
    revenue: number
    tickets: number
}
type TopMovie = {
    avgRating: number
    title: string
    revenue: number
    tickets: number
    showtimesCount: number
    occupancyAvg: number
}
type TicketByHour = {
    timeRange: string
    tickets: number
    percent: number
}
type RevenueCinema = {
    cinemaName: string
    revenue: number
    tickets: number
    occupancyAvg: number
    avgTicketPrice: number
}

type OccupancyTrend = {
    date: string
    rate: number
}
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Chỉ lấy payload đầu tiên (doanh thu)
        const entry = payload[0]
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 min-w-[200px]">
                <p className="font-semibold text-gray-800 mb-2">{`Ngày: ${label}`}</p>
                <p className="text-sm text-indigo-600 font-medium">
                    Doanh Thu: {formatCurrency(entry.value)}
                </p>
            </div>
        )
    }
    return null
}

export default function DashboardReportPage() {
    const [cinemasList, setCinemasList] = useState<Cinema[]>([])  // Danh sách rạp đầy đủ
    const [timeRange, setTimeRange] = useState("7days")           // 7days, 30days, custom
    const [selectedArea, setSelectedArea] = useState("Tất cả khu vực")
    const [selectedCinema, setSelectedCinema] = useState("Tất cả rạp")
    const [kpi, setKpi] = useState<KPI | null>(null)
    const [topMovies, setTopMovies] = useState<TopMovie[]>([])
    const [revenueCinemas, setRevenueCinemas] = useState<RevenueCinema[]>([])
    const [trends, setTrends] = useState<OccupancyTrend[]>([])
    const [loading, setLoading] = useState(true)
    const [customFromDate, setCustomFromDate] = useState<Date | null>(null)
    const [customToDate, setCustomToDate] = useState<Date | null>(null)


    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([])
    const [loadingCharts, setLoadingCharts] = useState(true)
    const [ticketByHours, setTicketByHours] = useState<any[]>([])
    const [loadingTab, setLoadingTab] = useState(false)
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a78bfa', '#f472b6'];
    // Lấy danh sách rạp 1 lần khi mount
    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const res = await getCinemas({ limit: 999 }) // load hết để lọc local
                setCinemasList(res.rows || [])
            } catch (err) {
                console.error("Lỗi tải rạp:", err)
                toast.error("Không tải được danh sách rạp")
            }
        }
        fetchCinemas()
    }, [])

    // Trích xuất khu vực unique từ cinemasList
    const uniqueAreas = useMemo(() => {
        const provinces = cinemasList
            .map(c => c.address?.[0]?.province?.trim())
            .filter(Boolean) as string[]
        return ["Tất cả khu vực", ...Array.from(new Set(provinces)).sort()]
    }, [cinemasList])

    // Trích xuất danh sách tên rạp unique
    const uniqueCinemas = useMemo(() => {
        const names = cinemasList.map(c => c.name?.trim()).filter(Boolean) as string[]
        return ["Tất cả rạp", ...Array.from(new Set(names)).sort()]
    }, [cinemasList])

    // Fetch báo cáo khi thay đổi bộ lọc
    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true)
            setLoadingTab(true)
            try {
                const params: any = {}

                // Thời gian
                if (timeRange === "7days") {
                    params.from = format(subDays(new Date(), 7), "yyyy-MM-dd")
                    params.to = format(new Date(), "yyyy-MM-dd")
                } else if (timeRange === "30days") {
                    params.from = format(subDays(new Date(), 30), "yyyy-MM-dd")
                    params.to = format(new Date(), "yyyy-MM-dd")
                }
                if (timeRange === "custom") {
                    if (!customFromDate || !customToDate) {
                        toast.error("Vui lòng chọn ngày bắt đầu và kết thúc")
                        return
                    }
                    // Dùng fromDate và toDate từ state input date
                    params.from = format(customFromDate, "yyyy-MM-dd")
                    params.to = format(customToDate, "yyyy-MM-dd")
                } else if (timeRange === "today") {
                    params.from = format(new Date(), "yyyy-MM-dd")
                    params.to = format(new Date(), "yyyy-MM-dd")
                } else if (timeRange === "7days") {
                    params.from = format(subDays(new Date(), 7), "yyyy-MM-dd")
                    params.to = format(new Date(), "yyyy-MM-dd")
                } else if (timeRange === "30days") {
                    params.from = format(subDays(new Date(), 30), "yyyy-MM-dd")
                    params.to = format(new Date(), "yyyy-MM-dd")
                } else if (timeRange === "this_month") {
                    const now = new Date()
                    params.from = format(startOfMonth(now), "yyyy-MM-dd")
                    params.to = format(endOfMonth(now), "yyyy-MM-dd")
                } else if (timeRange === "last_month") {
                    const now = new Date()
                    const lastMonth = subMonths(now, 1)
                    params.from = format(startOfMonth(lastMonth), "yyyy-MM-dd")
                    params.to = format(endOfMonth(lastMonth), "yyyy-MM-dd")
                } else if (timeRange === "this_quarter") {
                    // Tính quý hiện tại...
                } else if (timeRange === "this_year") {
                    params.from = format(startOfYear(new Date()), "yyyy-MM-dd")
                    params.to = format(endOfYear(new Date()), "yyyy-MM-dd")
                }
                // Khu vực
                if (selectedArea !== "all" && selectedArea !== "Tất cả khu vực") {
                    params.province = selectedArea
                }

                // Rạp
                if (selectedCinema !== "all" && selectedCinema !== "Tất cả rạp") {
                    const cinema = cinemasList.find(c => c.name === selectedCinema)
                    if (cinema) {
                        params.cinemaId = cinema.id
                    }
                }

                const res = await apiClient.get<any>("/report/dashboard", params)
                setKpi(res.data.kpi)
                setTopMovies(res.data.top_movies || [])
                setRevenueCinemas(res.data.revenue_cinemas || [])
                setTrends(res.data.occupancy_trends || [])
                //setDailyMetrics(res.data.daily_metrics || [])
                setTicketByHours(res.data.ticket_by_hours || [])
                //console.log("ticketByHours sau khi set:", res.data.ticket_by_hours || [])
            } catch (err) {
                console.error("Lỗi tải báo cáo:", err)
                toast.error("Không tải được báo cáo")
            } finally {
                setLoading(false)
                setLoadingTab(false)
            }
        }

        fetchReport()
    }, [timeRange, selectedArea, selectedCinema, cinemasList])
    useEffect(() => {
        const fetchDailyMetrics = async () => {
            setLoadingCharts(true)
            try {
                const toDate = new Date()
                const fromDate = subDays(toDate, 10)

                const params = {
                    from: format(fromDate, "yyyy-MM-dd"),
                    to: format(toDate, "yyyy-MM-dd"),
                }

                const res = await apiClient.get<any>("/report/dashboard", params)
                const metrics = res.data.daily_metrics || []
                console.log("daily_metrics từ API:", metrics) // ← LOG NÀY
                setDailyMetrics(metrics)
            } catch (err) {
                console.error("Lỗi tải dữ liệu theo ngày:", err)
                toast.error("Không tải được dữ liệu biểu đồ")
            } finally {
                setLoadingCharts(false)
            }
        }

        fetchDailyMetrics()
    }, [])
    const getChangeIcon = (value: number) => {
        if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
        if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
        return null
    }
    const pieData = ticketByHours.map(item => ({
        name: item.timeRange,           // dùng cho label, legend, tooltip
        value: Number(item.tickets),    // phải là number
    }));
    const getChangeColor = (value: number) => {
        if (value > 0) return "text-green-600"
        if (value < 0) return "text-red-600"
        return "text-gray-500"
    }
    const chartData = useMemo(() => {
        if (dailyMetrics.length === 0) return []

        const toDate = new Date()
        const fromDate = subDays(toDate, 9) // 10 ngày

        // Tìm ngày sớm nhất trong dailyMetrics (bỏ qua item không hợp lệ)
        const earliestDateStr = dailyMetrics.reduce((earliest, item) => {
            if (!item?.date || typeof item.date !== 'string') {
                return earliest // bỏ qua item lỗi
            }
            try {
                const d = parse(item.date.trim(), "dd/MM", new Date())
                return d < earliest ? d : earliest
            } catch (e) {
                console.warn("Ngày không hợp lệ:", item.date)
                return earliest
            }
        }, new Date(toDate))

        const startDate = earliestDateStr < fromDate ? earliestDateStr : fromDate

        const dataMap = new Map<string, { revenue: number; tickets: number }>()
        dailyMetrics.forEach(item => {
            if (item?.date && typeof item.date === 'string' && item.date.trim()) {
                dataMap.set(item.date.trim(), {
                    revenue: item.revenue ?? 0,
                    tickets: item.tickets ?? 0
                })
            }
        })

        const result = []
        let current = new Date(startDate)
        while (current <= toDate) {
            const dateStr = format(current, "dd/MM")
            const data = dataMap.get(dateStr) || { revenue: 0, tickets: 0 }
            result.push({ date: dateStr, revenue: data.revenue, tickets: data.tickets })
            current = addDays(current, 1)
        }

        //console.log("Chart Data (mở rộng 10 ngày gần nhất):", result)
        return result
    }, [dailyMetrics])
    const occupancyChartData = useMemo(() => {
        if (trends.length === 0) return [];

        // Parse ngày "dd/MM" → Date object (giả sử năm 2026 như current time)
        const parseDate = (dateStr: string) => {
            const [day, month] = dateStr.split('/');
            return new Date(2026, Number(month) - 1, Number(day));
        };

        // Tìm min/max date
        const dates = trends
            .map(item => parseDate(item.date))
            .filter(d => !isNaN(d.getTime()));

        if (dates.length === 0) return [];

        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        // Tạo tất cả ngày từ min → max
        const allDates: string[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            allDates.push(format(current, "dd/MM"));
            current = addDays(current, 1);
        }

        // Map dữ liệu gốc
        const dataMap = new Map<string, number>();
        trends.forEach(item => {
            dataMap.set(item.date.trim(), item.rate ?? 0);
        });

        // Tạo mảng chart data
        return allDates.map(dateStr => ({
            date: dateStr,
            rate: dataMap.get(dateStr) ?? 0,  // 0 nếu thiếu
            // Nếu muốn ngắt đường ở ngày không có suất chiếu: dùng null thay 0
            // rate: dataMap.has(dateStr) ? dataMap.get(dateStr) : null,
        }));
    }, [trends]);
    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Báo Cáo Thống Kê Tổng Hợp</h1>
                    <p className="text-muted-foreground">Phân tích doanh thu và hiệu suất kinh doanh</p>
                </div>
                <Button className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Download className="mr-2 h-4 w-4" />
                    Xuất Báo Cáo
                </Button>
            </div>

            {/* Bộ lọc */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Thời gian */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Khoảng thời gian</label>
                            <Select
                                value={timeRange}
                                onValueChange={(value) => {
                                    setTimeRange(value)
                                    // Nếu cần reset hoặc xử lý custom, thêm logic ở đây
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khoảng thời gian" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Hôm nay</SelectItem>
                                    <SelectItem value="7days">7 ngày qua</SelectItem>
                                    <SelectItem value="30days">30 ngày qua</SelectItem>
                                    <SelectItem value="this_month">Tháng này</SelectItem>       {/* value unique */}
                                    <SelectItem value="last_month">Tháng trước</SelectItem>     {/* value unique */}
                                    <SelectItem value="this_quarter">Quý này</SelectItem>       {/* value unique */}
                                    <SelectItem value="this_year">Năm nay</SelectItem>          {/* value unique */}
                                    <SelectItem value="custom">Tùy chỉnh (chọn ngày)</SelectItem> {/* value unique */}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Khu vực */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Khu vực</label>
                            <Select
                                value={selectedArea}
                                onValueChange={(value) => {
                                    setSelectedArea(value)
                                    // Nếu chọn "all" → không gửi province param
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả khu vực" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả khu vực</SelectItem> {/* ← value="all" thay vì "" */}
                                    {uniqueAreas.map(area => (
                                        <SelectItem key={area} value={area}>
                                            {area}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rạp chiếu */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Rạp chiếu</label>
                            <Select
                                value={selectedCinema}
                                onValueChange={(value) => setSelectedCinema(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả rạp" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả rạp</SelectItem> {/* ← value="all" */}
                                    {uniqueCinemas.map(cinema => (
                                        <SelectItem key={cinema} value={cinema}>
                                            {cinema}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            {kpi ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Card 1: Tổng Doanh Thu */}
                    <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                Tổng Doanh Thu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-3xl font-bold text-blue-800">
                                {formatCurrency(kpi.totalRevenue ?? 0)}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={cn(
                                    "flex items-center gap-1 font-medium",
                                    getChangeColor(kpi.revenueChangePct ?? 0)
                                )}>
                                    {getChangeIcon(kpi.revenueChangePct ?? 0)}
                                    {(kpi.revenueChangePct ?? 0).toFixed(1)}%
                                </div>
                                <span className="text-muted-foreground">so với kỳ trước</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Kỳ trước: {formatCurrency(kpi.prevTotalRevenue ?? 0)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Số Vé Bán Ra */}
                    <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                                Số Vé Bán Ra
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-3xl font-bold text-green-800">
                                {(kpi.totalTickets ?? 0).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={cn(
                                    "flex items-center gap-1 font-medium",
                                    getChangeColor(kpi.ticketChangePct ?? 0)
                                )}>
                                    {getChangeIcon(kpi.ticketChangePct ?? 0)}
                                    {(kpi.ticketChangePct ?? 0).toFixed(1)}%
                                </div>
                                <span className="text-muted-foreground">so với kỳ trước</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Kỳ trước: {(kpi.prevTotalTickets ?? 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Tỷ Lệ Lấp Đầy */}
                    <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                                Tỷ Lệ Lấp Đầy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-3xl font-bold text-purple-800">
                                {(kpi.avgOccupancy ?? 0).toFixed(1)}%
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={cn(
                                    "flex items-center gap-1 font-medium",
                                    getChangeColor(kpi.occupancyChangePct ?? 0)
                                )}>
                                    {getChangeIcon(kpi.occupancyChangePct ?? 0)}
                                    {(kpi.occupancyChangePct ?? 0).toFixed(1)}%
                                </div>
                                <span className="text-muted-foreground">so với kỳ trước</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Kỳ trước: {(kpi.prevAvgOccupancy ?? 0).toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: Khách Hàng */}
                    <Card className="bg-linear-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                                Khách Hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-3xl font-bold text-amber-800">
                                {(kpi.totalCustomers ?? 0).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className={cn(
                                    "flex items-center gap-1 font-medium",
                                    getChangeColor(kpi.customerChangePct ?? 0)
                                )}>
                                    {getChangeIcon(kpi.customerChangePct ?? 0)}
                                    {(kpi.customerChangePct ?? 0).toFixed(1)}%
                                </div>
                                <span className="text-muted-foreground">so với kỳ trước</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Kỳ trước: {(kpi.prevTotalCustomers ?? 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <Card className="mb-8">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Không có dữ liệu báo cáo trong khoảng thời gian này
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="doanhthu" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="doanhthu">Doanh Thu</TabsTrigger>
                    <TabsTrigger value="topphim">Top Phim</TabsTrigger>
                    <TabsTrigger value="phanborap">Phân Bổ Rạp</TabsTrigger>
                    <TabsTrigger value="khachhang">Khách Hàng</TabsTrigger>
                    <TabsTrigger value="hieusuat">Hiệu Suất</TabsTrigger>
                </TabsList>

                <TabsContent value="doanhthu">
                    {loadingCharts ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {Array(2).fill(0).map((_, i) => (
                                <Card key={i} className="h-[480px] bg-gray-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : dailyMetrics.length === 0 ? (
                        <Card>
                            <CardContent className="py-20 text-center text-muted-foreground">
                                Không có dữ liệu doanh thu hoặc vé bán ra trong 10 ngày qua
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Biểu đồ Doanh Thu */}
                            <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                                <CardHeader className="bg-linear-to-r from-indigo-50 to-purple-50 pb-3">
                                    <CardTitle className="text-xl font-semibold text-indigo-900">Biểu Đồ Doanh Thu</CardTitle>
                                    <CardDescription className="text-indigo-700">
                                        Doanh thu theo ngày trong 10 ngày qua
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="h-[420px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <YAxis
                                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    name="Doanh Thu"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#8b5cf6" }}
                                                    activeDot={{ r: 8, stroke: "#8b5cf6", strokeWidth: 3 }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#colorRevenue)" fillOpacity={0.4} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Biểu đồ Số Vé Bán Ra */}
                            <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                                <CardHeader className="bg-linear-to-r from-blue-50 to-cyan-50 pb-3">
                                    <CardTitle className="text-xl font-semibold text-blue-900">Số Vé Bán Ra</CardTitle>
                                    <CardDescription className="text-blue-700">
                                        Số lượng vé theo ngày trong 10 ngày qua
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="h-[420px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(value) => [`${(value as number).toLocaleString()} vé`, "Số Vé"]}
                                                    labelFormatter={(label) => `Ngày: ${label}`}
                                                />
                                                <Bar
                                                    dataKey="tickets"
                                                    name="Số Vé"
                                                    fill="#3b82f6"
                                                    radius={[12, 12, 0, 0]}
                                                    barSize={45}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Các tab khác tương tự */}
                <TabsContent value="topphim">
                    <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-amber-50 to-yellow-50 pb-3">
                            <CardTitle className="text-2xl font-bold text-amber-900 flex items-center gap-3">
                                <span>Top 5 Phim Doanh Thu Cao Nhất</span>
                                <Badge variant="secondary" className="text-sm font-normal bg-amber-100 text-amber-800">
                                    Xếp hạng theo doanh thu và lượt xem
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-amber-700 mt-1">
                                Xếp hạng theo doanh thu và lượt xem
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Hạng</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Tên Phim</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Doanh Thu</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Số Vé</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Suất Chiếu</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Lấp Đầy</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Đánh Giá</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {topMovies.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                                    Không có dữ liệu top phim trong khoảng thời gian này
                                                </td>
                                            </tr>
                                        ) : (
                                            topMovies.map((movie, index) => (
                                                <tr
                                                    key={movie.title}
                                                    className={cn(
                                                        "hover:bg-amber-50/50 transition-colors",
                                                        index === 0 && "bg-amber-50/70"
                                                    )}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {index === 0 ? (
                                                                <span className="text-2xl text-amber-500">★ 1</span>
                                                            ) : (
                                                                <span className="text-lg font-medium text-gray-600">#{index + 1}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {movie.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-emerald-700">
                                                        {formatCurrency(movie.revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-700">
                                                        {movie.tickets.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-700">
                                                        {movie.showtimesCount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={cn(
                                                            "font-medium px-3 py-1 rounded-full text-sm",
                                                            movie.occupancyAvg >= 90 ? "bg-green-100 text-green-800" :
                                                                movie.occupancyAvg >= 80 ? "bg-emerald-100 text-emerald-800" :
                                                                    movie.occupancyAvg >= 70 ? "bg-blue-100 text-blue-800" :
                                                                        "bg-gray-100 text-gray-800"
                                                        )}>
                                                            {movie.occupancyAvg.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 text-amber-500">
                                                            <span className="text-xl">★</span>
                                                            <span className="font-medium">{movie.avgRating.toFixed(1)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="phanborap">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Biểu đồ Doanh Thu Theo Rạp (Horizontal Bar) */}
                        <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                            <CardHeader className="bg-linear-to-r from-purple-50 to-pink-50 pb-3">
                                <CardTitle className="text-xl font-semibold text-purple-900">Doanh Thu Theo Rạp</CardTitle>
                                <CardDescription className="text-purple-700">
                                    So sánh hiệu suất giữa các rạp
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="h-[420px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={revenueCinemas}
                                            layout="vertical"
                                            margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                            <XAxis
                                                type="number"
                                                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="cinemaName"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                                            />
                                            <Tooltip
                                                formatter={(value) => [formatCurrency(value as number), "Doanh Thu"]}
                                                labelFormatter={(label) => `Rạp: ${label}`}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                name="Doanh Thu"
                                                fill="#a855f7"
                                                radius={[0, 8, 8, 0]}
                                                barSize={32}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Biểu đồ Phân Bổ Theo Khung Giờ (Pie Chart) */}
                        <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                            <CardHeader className="bg-linear-to-r from-cyan-50 to-blue-50 pb-3">
                                <CardTitle className="text-xl font-semibold text-cyan-900">Phân Bổ Theo Giờ Chiếu</CardTitle>
                                <CardDescription className="text-cyan-700">
                                    Lượng vé bán theo khung giờ
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="w-full h-[480px]">  {/* ← TĂNG LÊN 480px hoặc 500px */}
                                    {ticketByHours.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                            <p>Không có dữ liệu phân bổ khung giờ</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Debug block - chỉ hiển thị để kiểm tra, sau có thể xóa */}
                                            {/* <div className="bg-red-100 p-4 mb-4 text-red-800 rounded-md">
                                                <p><strong>Debug trước khi render Pie:</strong></p>
                                                <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                                                    {JSON.stringify(ticketByHours, null, 2)}
                                                </pre>
                                                <p>Tổng tickets: {ticketByHours.reduce((sum, item) => sum + (Number(item.tickets) || 0), 0)}</p>
                                                <p>Các tickets riêng lẻ: {ticketByHours.map(item => Number(item.tickets)).join(', ')}</p>
                                                <p>Types của tickets: {ticketByHours.map(item => typeof item.tickets).join(', ')}</p>
                                            </div> */}
                                            <ResponsiveContainer width="100%" height="100%">


                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={110}
                                                        paddingAngle={4}
                                                        // label={...}   ← COMMENT hoặc xóa tạm dòng này
                                                        labelLine={false}  // cũng tắt line cho chắc
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    {/* <Tooltip
                                                        formatter={(value: number, name: string) => [`${value} vé`, name]}
                                                    /> */}
                                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bảng Chi Tiết Hiệu Suất Rạp */}
                    <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-gray-50 to-slate-50 pb-3">
                            <CardTitle className="text-xl font-semibold text-slate-900">Chi Tiết Hiệu Suất Rạp</CardTitle>
                            <CardDescription className="text-slate-700">
                                Hiệu suất kinh doanh chi tiết theo từng rạp
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Rạp</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Doanh Thu</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Số Vé</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Tỷ Lệ Lấp Đầy</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Giá TB/Vé</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {revenueCinemas.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                    Không có dữ liệu hiệu suất rạp trong khoảng thời gian này
                                                </td>
                                            </tr>
                                        ) : (
                                            revenueCinemas.map((cinema) => (
                                                <tr key={cinema.cinemaName} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {cinema.cinemaName}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-emerald-700">
                                                        {formatCurrency(cinema.revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-700">
                                                        {cinema.tickets.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={cn(
                                                            "font-medium px-3 py-1 rounded-full text-sm",
                                                            cinema.occupancyAvg >= 90 ? "bg-green-100 text-green-800" :
                                                                cinema.occupancyAvg >= 80 ? "bg-emerald-100 text-emerald-800" :
                                                                    cinema.occupancyAvg >= 70 ? "bg-blue-100 text-blue-800" :
                                                                        "bg-gray-100 text-gray-800"
                                                        )}>
                                                            {cinema.occupancyAvg!.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-700">
                                                        {formatCurrency(cinema.avgTicketPrice)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hieusuat">
                    <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
                        <CardHeader className="bg-linear-to-r from-emerald-50 to-teal-50 pb-3">
                            <CardTitle className="text-xl font-semibold text-emerald-900">
                                Xu Hướng Tỷ Lệ Lấp Đầy
                            </CardTitle>
                            <CardDescription className="text-emerald-700">
                                Tỷ lệ ghế bán được theo ngày (%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[420px]">
                                {occupancyChartData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        Không có dữ liệu tỷ lệ lấp đầy
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={occupancyChartData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                            />

                                            <YAxis
                                                domain={[0, 100]}  // tỷ lệ phần trăm, giới hạn 0-100
                                                tickFormatter={(value) => `${value.toFixed(0)}%`}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                            />

                                            <Tooltip
                                                formatter={(value) => [
                                                    typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A',
                                                    "Tỷ lệ lấp đầy"
                                                ]}
                                                labelFormatter={(label) => `Ngày: ${label}`}
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px'
                                                }}
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="rate"
                                                name="Tỷ lệ lấp đầy"
                                                stroke="#10b981"          // màu xanh lá emerald
                                                strokeWidth={3}
                                                dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#10b981" }}
                                                activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 3 }}
                                            // connectNulls={false}   // Uncomment nếu dùng null ở ngày thiếu
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}