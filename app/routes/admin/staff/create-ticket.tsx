// routes/staff/create-ticket.tsx
import { useEffect, useState } from "react"
import { apiClient } from "~/lib/api/client"
import SeatMap from "~/components/booking/seatmap"
import BookingSummary from "~/components/booking/bookingSummary"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Label } from "~/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { getStaffShowtimes } from "~/lib/api/showtimeApi"
import type { BookingSeat } from "~/lib/api/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

export interface StaffShowtime {
  id: number
  publicCode: string
  movieTitle: string
  startTime: string
  posterUrl: string
  price?: number
}

export default function CreateTicketAtCounter() {
  const [showtimes, setShowtimes] = useState<StaffShowtime[]>([])
  const [selectedShowtime, setSelectedShowtime] = useState<StaffShowtime | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<BookingSeat[]>([])
  const [heldBy, setHeldBy] = useState<string>("STAFF")
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    paymentMethod: "CASH",
  })

  // Fetch suất chiếu
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true)
      try {
        const data = await getStaffShowtimes()
        setShowtimes(data || [])
      } catch (err) {
        toast.error("Lỗi tải suất chiếu")
        setShowtimes([])
      } finally {
        setLoading(false)
      }
    }
    fetchShowtimes()
  }, [])

  // Tạo vé
  const handleCreate = async () => {
    if (!selectedShowtime) {
      toast.error("Vui lòng chọn suất chiếu")
      return
    }
    if (selectedSeats.length === 0) {
      toast.error("Vui lòng chọn ghế")
      return
    }

    try {
      await apiClient.post(`/staff/ticket/create/${selectedShowtime.publicCode}`, {
        seatIds: selectedSeats.map(s => s.id),
        customerName: formData.customerName.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        paymentMethod: formData.paymentMethod,
      })

      toast.success("Tạo vé thành công!")
      // Reset form
      setSelectedSeats([])
      setFormData({ customerName: "", phone: "", email: "", paymentMethod: "CASH" })
      setSelectedShowtime(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tạo vé thất bại")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Chọn suất chiếu */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-3 border">
          <h2 className="text-xl font-bold mb-4">Chọn suất chiếu</h2>

          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : showtimes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-gray-300">🍿</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Hiện tại chưa có suất chiếu nào
              </p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Vui lòng chờ quản lý cập nhật lịch chiếu cho hôm nay hoặc các ngày sắp tới.
              </p>
            </div>
          ) : (
            <Select
              value={selectedShowtime?.id.toString() || ""}
              onValueChange={(value) => {
                const st = showtimes.find(s => s.id === Number(value))
                setSelectedShowtime(st || null)
                setSelectedSeats([]) // Reset ghế khi đổi suất
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Chọn suất chiếu để bán vé" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {showtimes.map(st => (
                  <SelectItem key={st.id} value={st.id.toString()}>
                    <div className="flex items-center gap-3 py-1">
                      <img
                        src={st.posterUrl || "https://via.placeholder.com/40x60"}
                        alt={st.movieTitle}
                        className="w-10 h-14 object-cover rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{st.movieTitle}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(st.startTime), "HH:mm - EEEE, dd/MM", { locale: vi })}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Cột 2: Sơ đồ ghế */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-6 border">
          <h2 className="text-xl font-bold mb-4">Sơ đồ ghế</h2>
          {selectedShowtime ? (
            <SeatMap
              code={selectedShowtime.publicCode}
              showtimeId={selectedShowtime.id}
              selectedSeats={selectedSeats}
              onChange={setSelectedSeats}
              heldBy={heldBy}
              setHeldBy={setHeldBy}
              isStaff={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 bg-gray-50 rounded-lg">
              <div className="text-8xl mb-6">🎥</div>
              <p className="text-lg font-medium">Chọn suất chiếu để xem sơ đồ ghế</p>
              <p className="text-sm mt-2">Ghế trống sẽ hiển thị màu xanh</p>
            </div>
          )}
        </div>

        {/* Cột 3: Thông tin vé & Tạo vé */}
        <div className="lg:col-span-3 space-y-6">
          {selectedShowtime ? (
            <>
              <BookingSummary
                code={selectedShowtime.publicCode}
                showtime={selectedShowtime}
                selectedSeats={selectedSeats}
                heldBy={heldBy}
                isStaff={true}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full text-lg py-6"
                    disabled={selectedSeats.length === 0}
                  >
                    Tạo vé ({selectedSeats.length} ghế)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận tạo vé</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        Phim: <strong>{selectedShowtime.movieTitle}</strong>
                      </p>
                      <p>
                        Suất: <strong>{format(new Date(selectedShowtime.startTime), "HH:mm - dd/MM/yyyy", { locale: vi })}</strong>
                      </p>
                      <p>
                        Số ghế: <strong>{selectedSeats.length} ghế</strong>
                      </p>
                      <p className="text-sm text-orange-600 mt-4">
                        Sau khi xác nhận, ghế sẽ được giữ vĩnh viễn và tạo hóa đơn.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreate}>
                      Xác nhận tạo vé
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow p-8 border text-center">
              <div className="text-6xl mb-4 text-gray-300">🎫</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Chọn suất chiếu để bắt đầu bán vé
              </p>
              <p className="text-sm text-gray-500">
                Thông tin vé và tổng tiền sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}