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
import { CalendarIcon, Search as SearchIcon, Clock as ClockIcon, Clock, MapPin } from "lucide-react"
import { AlertTriangle } from "lucide-react"

// API fetch showtimes và cinemas
import { deleteShowtime, getShowtimes } from "~/lib/api/showtimeApi"
import { getCinemas } from "~/lib/api/cinemaApi"
import type { ShowtimeResponse, Cinema } from "~/lib/api/types"
import { CreateShowtimeDialog } from "~/components/showtime/dialog"
import { Button } from "~/components/ui/button"
import React from "react"
import { toast } from "sonner"
import { EditShowtimeDialog } from "~/components/showtime/EditShowtimeDialog"

export const safeFormat = (value?: string, pattern: string = "dd/MM/yyyy") => {
    if (!value) return "—"; // Không có giá trị → hiển thị dấu gạch

    const d = new Date(value);

    // Kiểm tra nếu Date không hợp lệ (NaN)
    if (isNaN(d.getTime())) return "—";

    return format(d, pattern);
};
function getTimePosition2h(timeString: string) {
    const date = new Date(timeString);
    const hour = date.getHours();
    const minute = date.getMinutes();

    // timeline từ 06:00 → 24:00
    const startHour = 6;

    const total = hour + minute / 60;
    const index = (total - startHour) / 2;

    return Math.max(0, Math.floor(index));
}
export const getStartTime = (value?: string) => safeFormat(value, "HH:mm");
export const getEndTime = (value?: string) => safeFormat(value, "HH:mm");
export default function ScheduleManagement() {
    const [showtimes, setShowtimes] = useState<ShowtimeResponse[]>([])
    const [filteredShowtimes, setFilteredShowtimes] = useState<ShowtimeResponse[]>([])
    const [cinemasList, setCinemasList] = useState<Cinema[]>([])  // State mới cho cinemas đầy đủ
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedArea, setSelectedArea] = useState("Tất cả khu vực")
    const [selectedCinema, setSelectedCinema] = useState("Tất cả rạp")
    const [totalShowtimes, setTotalShowtimes] = useState(0)
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [averageFillRate, setAverageFillRate] = useState(0)
    const [noData, setNoData] = useState(false)  // State mới để kiểm tra không có lịch chiếu
    const [editingShowtime, setEditingShowtime] = useState<ShowtimeResponse | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);  // State mới để control dialog tạo mới

    const handleDeleteShowtime = async (id: number) => {
        if (!confirm("Bạn chắc chắn muốn xoá lịch chiếu này?")) return;
        try {
            await deleteShowtime(id);
            toast.success("Xoá lịch chiếu thành công");
            refreshShowtimes();
        } catch (err) {
            toast.error("Xoá thất bại");
            console.error(err);
        }
    };
    const openEditDialog = (showtime: ShowtimeResponse) => {
        setIsCreateDialogOpen(false)       // Đảm bảo đóng dialog tạo mới
        setEditingShowtime(showtime)       // Mở dialog sửa
    };
    // Fetch cinemas đầy đủ (1 lần)
    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const res = await getCinemas({ limit: 999 })
                setCinemasList(res.rows)
            } catch (err) {
                console.error("Lỗi fetch cinemas:", err)
            }
        }
        fetchCinemas()
    }, [])

    // Fetch showtimes theo ngày, khu vực và rạp (filter server-side)
    useEffect(() => {
        const fetchShowtimes = async () => {
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd")
                const params: any = { startDate: dateStr };

                // Truyền Province nếu không phải "Tất cả"
                if (selectedArea !== "Tất cả khu vực") {
                    params.province = selectedArea;
                }

                // Truyền CinemaId nếu không phải "Tất cả" (map từ name sang id)
                if (selectedCinema !== "Tất cả rạp") {
                    const cinemaId = cinemasList.find(c => c.name === selectedCinema)?.id;
                    if (cinemaId) {
                        params.cinemaId = cinemaId;
                    }
                }

                const res = await getShowtimes(params)
                setShowtimes(res)
                setNoData(res.length === 0)  // Kiểm tra không có dữ liệu
            } catch (err) {
                console.error("Lỗi fetch showtimes:", err)
                setNoData(true)
            }
        }
        fetchShowtimes()
    }, [selectedDate, selectedArea, selectedCinema])  // Phụ thuộc vào ngày, khu vực, rạp

    // Filter client-side chỉ cho searchTerm (nếu cần, nhưng giờ filter chủ yếu server-side)
    useEffect(() => {
        let filtered = showtimes
        if (searchTerm) {
            filtered = filtered.filter(s => s.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        }
        setFilteredShowtimes(filtered)

        setTotalShowtimes(filtered.length)
        const revenue = filtered.reduce((sum, s) => sum + s.booked_seats * (s.price || 0), 0)
        setTotalRevenue(revenue)
        const fillRates = filtered.map(s => s.fill_rate)
        const avgFill = fillRates.length > 0 ? fillRates.reduce((sum, rate) => sum + rate, 0) / fillRates.length : 0
        setAverageFillRate(Math.round(avgFill))
    }, [showtimes, searchTerm])

    // Hàm helper
    const getTotalSeats = (s: ShowtimeResponse) => s.total_seats
    const getBookedSeats = (s: ShowtimeResponse) => s.booked_seats
    const getStatus = (s: ShowtimeResponse) => getBookedSeats(s) >= getTotalSeats(s) ? "FULL" : "AVAILABLE"

    // Unique areas & cinemas từ cinemasList (đầy đủ)
    const rawAreas = cinemasList.map(c => c.address?.[0]?.province ?? "")
    const uniqueAreas = Array.from(new Set(rawAreas)).filter(Boolean).sort()
    const areas = ["Tất cả khu vực", ...uniqueAreas]

    const uniqueCinemas = Array.from(new Set(cinemasList.map(c => c.name ?? ""))).filter(Boolean).sort()
    const cinemas = ["Tất cả rạp", ...uniqueCinemas]

    // Hàm tính vị trí cho timeline
    const getTimePosition = (time?: string) => {
        if (!time) return 0;
        const date = new Date(time)
        if (isNaN(date.getTime())) return 0;
        const hours = date.getHours()
        const minutes = date.getMinutes()
        return ((hours - 6) * 60 + minutes) / 30 // Offset từ 06:00
    }

    const refreshShowtimes = async () => {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const params: any = { startDate: dateStr };

        if (selectedArea !== "Tất cả khu vực") {
            params.Province = selectedArea;
        }

        if (selectedCinema !== "Tất cả rạp") {
            const cinemaId = cinemasList.find(c => c.name === selectedCinema)?.id;
            if (cinemaId) {
                params.CinemaId = cinemaId;
            }
        }

        const res = await getShowtimes(params)
        setShowtimes(res)
        setNoData(res.length === 0)
    }

    // Group by room cho timeline
    const rooms = [...new Set(filteredShowtimes.map(s => `${s.room?.name ?? ""} ${s.room?.formats?.length ? `(${s.room.formats[0]?.name})` : ""}`.trim()))]

   function setOpenCreate(open: boolean): void {
        setIsCreateDialogOpen(open)
    }

    function setOpenEdit(open: boolean): void {
        if (!open) {
            setEditingShowtime(null)
        }
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Quản Lý Lịch Chiếu</h1>
                <Button onClick={() => setIsCreateDialogOpen(true)}>Tạo lịch chiếu mới</Button>  {/* Thay dialog trực tiếp bằng button trigger */}
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
                        <p className="text-sm text-gray-600">Doanh thu đã đạt</p>
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
                        className="pl-10!"
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
                        <SelectValue placeholder="Chọn rạp" />
                    </SelectTrigger>

                    {/* Giới hạn chiều cao + bật scroll */}
                    <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Tất cả rạp">Tất cả rạp</SelectItem>

                        {cinemasList.map(cinema => (
                            <SelectItem key={cinema.id} value={cinema.name}>
                                {cinema.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="list">
                <TabsList className="justify-end w-full">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="list">Danh sách</TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    {noData ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <AlertTriangle className="w-8 h-8 mb-2" />
                            <p>Không có lịch chiếu cho ngày {format(selectedDate, "dd/MM/yyyy")}.</p>
                            <p>Vui lòng chọn ngày khác hoặc tạo lịch chiếu mới.</p>
                        </div>
                    ) : (
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
                                    <TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredShowtimes.map(s => {
                                    const booked = getBookedSeats(s)
                                    const total = getTotalSeats(s)
                                    const fillRate = s.fill_rate
                                    const progressColor = fillRate < 50 ? "bg-green-500" : fillRate < 80 ? "bg-blue-500" : fillRate < 100 ? "bg-yellow-500" : "bg-red-500"
                                    const status = getStatus(s)
                                    return (
                                        <TableRow key={s.start_time}>
                                            <TableCell>{s.movie.title}</TableCell>
                                            <TableCell>
                                                {s.room?.cinema?.name || "—"} - {s.room.name}
                                                {s.room.formats.length > 0 && <Badge className="ml-2">{s.room.formats[0].name}</Badge>}
                                            </TableCell>
                                            <TableCell>{s.room?.cinema?.address?.[0]?.province || "—"}</TableCell>
                                            <TableCell>{safeFormat(s.start_time, "dd/MM/yyyy")}</TableCell>
                                            <TableCell>{getStartTime(s.start_time)} - {getEndTime(s.end_time)}</TableCell>
                                            <TableCell>{(s.price || 0).toLocaleString("vi-VN")} đ</TableCell>
                                            <TableCell>{booked}/{total}</TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <div className="relative w-20 h-2 bg-gray-200 rounded overflow-hidden">
                                                    <div
                                                        className={`h-full ${progressColor}`}
                                                        style={{ width: `${Math.round(fillRate)}%` }}
                                                    />
                                                </div>
                                                {Math.round(fillRate)}%
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status === "AVAILABLE" ? "default" : "destructive"}>
                                                    {status === "AVAILABLE" ? "Còn vé" : "Hết vé"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditDialog(s)}
                                                    >
                                                        Sửa
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteShowtime(s.id)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </TabsContent>
                <TabsContent value="timeline">
                    {noData ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <AlertTriangle className="w-8 h-8 mb-2" />
                            <p>Không có lịch chiếu cho ngày {format(selectedDate, "dd/MM/yyyy")}.</p>
                            <p>Vui lòng chọn ngày khác hoặc tạo lịch chiếu mới.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border bg-white">

                            {/* HEADER */}
                            <div className="grid grid-cols-[220px_repeat(7,160px)] bg-white border-t border-l text-sm">  {/* Adjust to 7 columns for 06:00 to 18:00 to match image */}
                                <div className="sticky left-0 bg-white border-b border-r p-3 font-semibold z-20">
                                    Phòng Chiếu
                                </div>

                                {[
                                    "06:00", "08:00", "10:00", "12:00",
                                    "14:00", "16:00", "18:00"
                                ].map(time => (
                                    <div
                                        key={time}
                                        className="text-center text-gray-500 border-b border-r py-2 font-medium"
                                    >
                                        {time}
                                    </div>
                                ))}
                            </div>

                            {/* BODY */}
                            <div className="bg-white border-l">
                                {rooms.map(roomName => {
                                    const roomShowtimes = filteredShowtimes.filter(s => {
                                        const formatted = `${s.room.name} ${s.room.formats?.[0] ? `(` + s.room.formats[0].name + `)` : ""
                                            }`.trim();
                                        return formatted === roomName;
                                    });

                                    const room = roomShowtimes[0]?.room;

                                    return (
                                        <div key={roomName} className="grid grid-cols-[220px_auto] border-t">

                                            {/* LEFT ROOM INFO */}
                                            <div className="sticky left-0 bg-white p-3 border-r z-20">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-gray-900">
                                                        {room?.name}
                                                    </div>

                                                    {/* FORMAT BADGE */}
                                                    {room?.formats?.[0] && (
                                                        <span
                                                            className={`
                        inline-block px-2 py-0.5 text-xs rounded-full text-white
                        ${room.formats[0].name === "IMAX"
                                                                    ? "bg-blue-500"
                                                                    : room.formats[0].name === "VIP"
                                                                        ? "bg-purple-500"
                                                                        : "bg-gray-500"
                                                                }
                      `}
                                                        >
                                                            {room.formats[0].name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* CINEMA NAME */}
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {room?.cinema?.name ?? "—"}
                                                </div>
                                            </div>

                                            {/* TIMELINE RIGHT */}
                                            <div className="relative border-r h-20">  {/* Fixed height for row consistency */}

                                                {/* BACKGROUND GRID */}
                                                <div className="grid grid-cols-[repeat(7,160px)]">
                                                    {[...Array(7)].map((_, i) => (
                                                        <div key={i} className="border-r h-20 bg-white" />
                                                    ))}
                                                </div>

                                                {/* SHOWTIME BLOCKS */}
                                                {roomShowtimes.map(show => {

                                                    const start = new Date(show.start_time);
                                                    const end = new Date(show.end_time);

                                                    const base = 6; // timeline bắt đầu từ 06:00
                                                    const pxPerHour = 80; // 160px / 2 hours per column = 80px/hour

                                                    const startHour = start.getHours() + start.getMinutes() / 60;
                                                    const endHour = end.getHours() + end.getMinutes() / 60;

                                                    const left = (startHour - base) * pxPerHour;
                                                    const width = (endHour - startHour) * pxPerHour;

                                                    const booked = getBookedSeats(show);
                                                    const total = getTotalSeats(show);
                                                    const fill = Math.round(show.fill_rate);

                                                    // Color logic (giống mẫu B)
                                                    const bg =
                                                        fill < 50
                                                            ? "bg-blue-100 text-blue-800"
                                                            : fill < 80
                                                                ? "bg-blue-100 text-blue-800"  // Giữ blue cho <80 để match hình (chỉ pink cho high)
                                                                : fill < 100
                                                                    ? "bg-pink-100 text-pink-800"
                                                                    : "bg-pink-100 text-pink-800";

                                                    return (
                                                        <div
                                                            key={show.id}
                                                            className={`absolute p-2 rounded-md shadow-sm border ${bg} flex flex-col group`}  // Thêm 'group' cho hover
                                                            style={{
                                                                left: `${left}px`,
                                                                width: `${width}px`,
                                                                top: "15px",  // Adjust vertical position to center
                                                            }}
                                                        >
                                                            <div className="font-medium text-sm whitespace-normal leading-tight">
                                                                {show.movie.title}
                                                            </div>

                                                            <div className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                                                                ○ {format(new Date(show.start_time), "HH:mm")}  {/* Thay icon bằng ○ để match hình */}
                                                            </div>

                                                            <div className="text-xs opacity-70">
                                                                {booked}/{total} ({fill}%)
                                                            </div>
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 
                            flex gap-1 transition-opacity">
                                                                <button
                                                                    className="h-5 w-5 rounded bg-white/80 text-xs border border-gray-300 hover:bg-white"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditDialog(show);
                                                                    }}
                                                                >
                                                                    ✏️
                                                                </button>

                                                                <button
                                                                    className="h-5 w-5 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteShowtime(show.id);
                                                                    }}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>

                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </TabsContent>


            </Tabs>
            <CreateShowtimeDialog
                selectedDate={selectedDate}
                refreshShowtimes={refreshShowtimes}
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen} 
                />

            {/* Dialog sửa (mở khi editingShowtime != null) */}
            {editingShowtime && (
                <EditShowtimeDialog  // Sử dụng component mới cho sửa
                    selectedDate={selectedDate}
                    refreshShowtimes={refreshShowtimes}
                    editingShowtime={editingShowtime}
                    open={true}
                    onOpenChange={() => setEditingShowtime(null)}
                    onClose={() => setOpenEdit(false)}                />
            )}
        </div>
    )
}  