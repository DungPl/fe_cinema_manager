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

// Type StaffShowtime
export interface StaffShowtime {
  id: number
  publicCode: string
  movieTitle: string
  startTime: string
  posterUrl: string
  price?: number // Optional, fallback nếu null
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
      try {
        const data = await getStaffShowtimes()
        setShowtimes(data)
      } catch (err) {
        toast.error("Lỗi tải suất chiếu")
      } finally {
        setLoading(false)
      }
    }
    fetchShowtimes()
  }, [])

  // Tạo vé
  const handleCreate = async () => {
    if (!selectedShowtime) return toast.error("Vui lòng chọn suất chiếu")
    if (selectedSeats.length === 0) return toast.error("Vui lòng chọn ghế")

    try {
      await apiClient.post(`/staff/ticket/create/${selectedShowtime.publicCode}`, {
        seatIds: selectedSeats.map(s => s.id),
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
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
        {/* Cột 1: Thông tin suất chiếu */}
        <div className="bg-white rounded-xl shadow p-4 lg:col-span-3 border">
          <h2 className="text-lg font-bold mb-2">Suất chiếu</h2>
          <p className="text-xs text-gray-500 mb-3">Chọn suất chiếu</p>

          {loading ? (
            <div className="text-center py-6 text-sm">Đang tải...</div>
          ) : showtimes.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">Không có suất chiếu</div>
          ) : (
            <Select
              onValueChange={(value) => {
                const st = showtimes.find(s => s.id === Number(value))
                setSelectedShowtime(st || null)
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Chọn suất chiếu" />
              </SelectTrigger>
              <SelectContent>
                {showtimes.map(st => (
                  <SelectItem key={st.id} value={st.id.toString()}>
                    <div className="flex items-center gap-2">
                      <img
                        src={st.posterUrl || "https://via.placeholder.com/32x48"}
                        alt={st.movieTitle}
                        className="w-8 h-12 object-cover rounded"
                      />
                      <div className="flex flex-col text-xs">
                        <span className="font-medium truncate max-w-[140px]">{st.movieTitle}</span>
                        <span className="text-gray-500">
                          {format(new Date(st.startTime), "dd/MM HH:mm", { locale: vi })}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Cột 2: SeatMap */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-6 border">
          <h2 className="text-xl font-bold mb-3">Chọn ghế</h2>
          {selectedShowtime ? (
            <SeatMap
              code={selectedShowtime.publicCode}
              showtimeId={selectedShowtime.id}
              selectedSeats={selectedSeats}
              onChange={setSelectedSeats}
              heldBy={heldBy}
              setHeldBy={setHeldBy}
              isStaff={true} // Bật chế độ nhân viên
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
              <div className="text-8xl mb-4">🛋️</div>
              <p>Chọn suất chiếu để xem sơ đồ ghế</p>
            </div>
          )}
        </div>

        {/* Cột 3: Booking Summary */}
        <div className="lg:col-span-3">
          <BookingSummary
            code={selectedShowtime?.publicCode || ""}
            showtime={selectedShowtime as any}
            selectedSeats={selectedSeats}
            heldBy={heldBy}
            isStaff={true}
          />
          {/* Nút tạo vé với confirm modal */}
          {selectedShowtime && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full mt-4" disabled={selectedSeats.length === 0}>
                  Tạo vé ({selectedSeats.length} ghế)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận tạo vé?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sẽ tạo vé cho {selectedSeats.length} ghế. Ghế sẽ được release sau khi tạo thành công.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCreate}>Xác nhận</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}