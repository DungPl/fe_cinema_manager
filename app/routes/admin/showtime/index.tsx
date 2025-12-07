// ~/components/schedule/ScheduleManagement.tsx
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Progress } from "~/components/ui/progress"
import { Badge } from "~/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Calendar } from "~/components/ui/calendar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon, Search as SearchIcon, Clock as ClockIcon } from "lucide-react"

// API fetch showtimes
import { getShowtimes } from "~/lib/api/showtimeApi"
import type { ShowtimeResponse } from "~/lib/api/types"
import { CreateShowtimeDialog } from "~/components/showtime/dialog"
import { Button } from "~/components/ui/button"
export default function ScheduleManagement() {
    const [showtimes, setShowtimes] = useState<ShowtimeResponse[]>([])
    const [filteredShowtimes, setFilteredShowtimes] = useState<ShowtimeResponse[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedArea, setSelectedArea] = useState("Tất cả khu vực")
    const [selectedCinema, setSelectedCinema] = useState("Tất cả rạp")
    const [totalShowtimes, setTotalShowtimes] = useState(0)
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [averageFillRate, setAverageFillRate] = useState(0)

    useEffect(() => {
        const fetchShowtimes = async () => {
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd")
                const res = await getShowtimes({ startDate: dateStr })
                setShowtimes(res)
            } catch (err) {
                console.error("Lỗi fetch showtimes:", err)
            }
        }
        fetchShowtimes()
    }, [selectedDate])

    useEffect(() => {
        let filtered = showtimes
        if (searchTerm) {
            filtered = filtered.filter(s => s.movie.title.toLowerCase().includes(searchTerm.toLowerCase()))
        }
        if (selectedArea !== "Tất cả khu vực") {
            filtered = filtered.filter(s => s.room.Cinema.address?.[0]?.province === selectedArea)
        }
        if (selectedCinema !== "Tất cả rạp") {
            filtered = filtered.filter(s => s.room.Cinema.name === selectedCinema)
        }
        setFilteredShowtimes(filtered)

        // Tính tổng
        setTotalShowtimes(filtered.length)
        const revenue = filtered.reduce((sum, s) => sum + s.bookedSeats * (s.price || 0), 0)
        setTotalRevenue(revenue)
        const fillRates = filtered.map(s => s.fillRate)
        const avgFill = fillRates.length > 0 ? fillRates.reduce((sum, rate) => sum + rate, 0) / fillRates.length : 0
        setAverageFillRate(Math.round(avgFill))
    }, [showtimes, searchTerm, selectedArea, selectedCinema])

    // Hàm helper
    const getTotalSeats = (s: ShowtimeResponse) => s.totalSeats
    const getBookedSeats = (s: ShowtimeResponse) => s.bookedSeats
    const getStatus = (s: ShowtimeResponse) => getBookedSeats(s) >= getTotalSeats(s) ? "FULL" : "AVAILABLE"
    const getStartTime = (timestamp: string) => format(new Date(timestamp), "HH:mm")
    const getEndTime = (timestamp: string) => format(new Date(timestamp), "HH:mm")

    // Unique areas (provinces) và cinemas
    const areas = ["Tất cả khu vực", ...new Set(showtimes.map(s => s.room.Cinema.address?.[0]?.province || ""))]
    const cinemas = ["Tất cả rạp", ...new Set(showtimes.map(s => s.room.Cinema.name || ""))]

    // Hàm tính vị trí cho timeline (dựa trên giờ, giả sử từ 06:00, mỗi 30p = 1 unit)
    const getTimePosition = (time: string) => {
        const date = new Date(time)
        const hours = date.getHours()
        const minutes = date.getMinutes()
        return ((hours - 6) * 60 + minutes) / 30 // Offset từ 06:00
    }
    const refreshShowtimes = async () => {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const res = await getShowtimes({ startDate: dateStr })
        setShowtimes(res)
    }
    // Group by room cho timeline
    const rooms = [...new Set(filteredShowtimes.map(s => `${s.room.name} ${s.room.formats.length ? `(${s.room.formats[0].name})` : ""}`.trim()))]

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Quản Lý Lịch Chiếu</h1>
                <CreateShowtimeDialog
                    selectedDate={selectedDate}
                    refreshShowtimes={refreshShowtimes}
                />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tổng suất chiếu</p>
                        <p className="text-xl font-bold">{totalShowtimes}</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                        <span className="text-green-600">$</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Doanh thu đã đặt</p>
                        <p className="text-xl font-bold">{totalRevenue.toLocaleString("vi-VN")} đ</p>
                    </div>
                </div>
                <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                        <span className="text-purple-600">%</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tỷ lệ lấp đầy</p>
                        <p className="text-xl font-bold">{averageFillRate}%</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Tìm kiếm phim..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-between">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
                    </PopoverContent>
                </Popover>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {areas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {cinemas.map(cinema => <SelectItem key={cinema} value={cinema}>{cinema}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="list">
                <TabsList className="justify-end w-full">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="list">Danh sách</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Phim</TableHead>
                                <TableHead>Rạp / Phòng</TableHead>
                                <TableHead>Khu Vực</TableHead>
                                <TableHead>Ngày Chiếu</TableHead>
                                <TableHead>Giờ Chiếu</TableHead>
                                <TableHead>Giá Vé</TableHead>
                                <TableHead>Ghế Đã Đặt</TableHead>
                                <TableHead>Tỷ Lệ</TableHead>
                                <TableHead>Trạng Thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredShowtimes.map(s => {
                                const booked = getBookedSeats(s)
                                const total = getTotalSeats(s)
                                const fillRate = s.fillRate
                                const progressColor = fillRate < 50 ? "bg-green-500" : fillRate < 80 ? "bg-blue-500" : fillRate < 100 ? "bg-yellow-500" : "bg-red-500"
                                const status = getStatus(s)
                                return (
                                    <TableRow key={s.startTime}> {/* No id, use startTime as key */}
                                        <TableCell>{s.movie.title}</TableCell>
                                        <TableCell>
                                            {s.room.Cinema.name} - {s.room.name}
                                            {s.room.formats.length > 0 && <Badge className="ml-2">{s.room.formats[0].name}</Badge>}
                                        </TableCell>
                                        <TableCell>{s.room.Cinema.address?.[0]?.province}</TableCell>
                                        <TableCell>{format(new Date(s.startTime), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>{getStartTime(s.startTime)} - {getEndTime(s.endTime)}</TableCell>
                                        <TableCell>{(s.price || 0).toLocaleString("vi-VN")} đ</TableCell>
                                        <TableCell>{booked}/{total}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Progress value={fillRate} className={`w-20 h-2 ${progressColor}`} />
                                            {Math.round(fillRate)}%
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status === "AVAILABLE" ? "default" : "destructive"}>
                                                {status === "AVAILABLE" ? "Còn vé" : "Hết vé"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="timeline">
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-[250px_repeat(24,1fr)] min-w-max border-t border-l"> {/* Điều chỉnh width cho phòng */}
                            {/* Header thời gian */}
                            <div className="sticky left-0 bg-white border-b border-r p-2 font-medium">Phòng Chiếu</div>
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="text-center text-sm text-gray-600 border-b border-r pb-1">
                                    {Math.floor(i / 2 + 6).toString().padStart(2, "0")}:{(i % 2 === 0 ? "00" : "30")}
                                </div>
                            ))}

                            {/* Các phòng */}
                            {rooms.map(room => {
                                const roomShowtimes = filteredShowtimes.filter(s => `${s.room.name} ${s.room.formats.length ? `(${s.room.formats[0].name})` : ""}`.trim() === room)
                                return (
                                    <>
                                        <div key={room} className="sticky left-0 bg-white p-2 border-r border-b font-medium truncate">
                                            {room}<br /><small className="text-gray-500">{roomShowtimes[0]?.room.Cinema.name}</small>
                                        </div>
                                        {Array.from({ length: 24 }).map((_, col) => (
                                            <div key={`${room}-${col}`} className="border-r border-b h-20" /> // Tăng height cho block
                                        ))}
                                        {roomShowtimes.map(s => {
                                            const startPos = getTimePosition(s.startTime)
                                            const duration = getTimePosition(s.endTime) - startPos
                                            const booked = getBookedSeats(s)
                                            const total = getTotalSeats(s)
                                            const fillRate = s.fillRate
                                            const bgColor = fillRate < 50 ? "bg-blue-100 text-blue-800" : fillRate < 80 ? "bg-pink-100 text-pink-800" : "bg-yellow-100 text-yellow-800"
                                            return (
                                                <div
                                                    key={s.startTime}
                                                    className={`p-1 rounded-md ${bgColor} text-xs border border-gray-300`}
                                                    style={{
                                                        gridColumn: `${startPos + 2} / span ${duration}`,
                                                        gridRow: `${rooms.indexOf(room) + 2}`,
                                                    }}
                                                >
                                                    {s.movie.title}
                                                    <br />
                                                    <ClockIcon className="inline w-3 h-3" /> {getStartTime(s.startTime)}
                                                    <br />
                                                    {booked}/{total} ({Math.round(fillRate)}%)
                                                </div>
                                            )
                                        })}
                                    </>
                                )
                            })}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    )
} 