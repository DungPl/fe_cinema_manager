// routes/staff/create-ticket.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {apiClient} from "~/lib/api/client"
import SeatMap from "~/components/booking/seatmap" // Tái sử dụng component sơ đồ ghế
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

// Type cho suất chiếu từ API /staff/showtimes
export interface StaffShowtime {
  id: number
  publicCode: string
  movieTitle: string
  startTime: string // "2025-12-28T14:00:00Z"
}

export const getStaffShowtimes = async (): Promise<StaffShowtime[]> => {
  const res = await apiClient.get<{
    success: boolean
    data: StaffShowtime[]
  }>("/showtime/staff")

  return res.data // Trả về mảng StaffShowtime[]
}

export default function CreateTicketAtCounter() {
  const navigate = useNavigate()
  const [showtimes, setShowtimes] = useState<StaffShowtime[]>([])
  const [selectedShowtime, setSelectedShowtime] = useState<StaffShowtime | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]) // Ghế từ SeatMap
  const [loading, setLoading] = useState(true)

  // Form thông tin khách hàng & thanh toán
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    paymentMethod: "CASH"
  })

  // Fetch suất chiếu của rạp
  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const data = await getStaffShowtimes()
        setShowtimes(data)
      } catch (err) {
        toast.error("Lỗi tải suất chiếu của rạp")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchShowtimes()
  }, [])

  const handleCreate = async () => {
    if (!selectedShowtime) {
      toast.error("Vui lòng chọn suất chiếu")
      return
    }
    if (selectedSeats.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ghế")
      return
    }

    try {
      await apiClient.post("/showtime/create-ticket", {
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeats.map(s => s.id),
        customerName: formData.customerName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        paymentMethod: formData.paymentMethod
      })
      toast.success("Tạo vé tại quầy thành công")
      // Reset form
      setSelectedSeats([])
      setFormData({ customerName: "", phone: "", email: "", paymentMethod: "CASH" })
      setSelectedShowtime(null)
    } catch (err: any) {
      toast.error(err.message || "Tạo vé thất bại")
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tạo vé tại quầy</h1>

      {loading ? (
        <div className="text-center py-10">Đang tải suất chiếu...</div>
      ) : showtimes.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Không có suất chiếu nào cho rạp của bạn.
        </div>
      ) : (
        <>
          {/* Chọn suất chiếu */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Chọn suất chiếu</label>
            <Select
              onValueChange={(value) => {
                const st = showtimes.find(s => s.id === Number(value))
                setSelectedShowtime(st || null)
              }}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Chọn suất chiếu" />
              </SelectTrigger>
              <SelectContent>
                {showtimes.map(st => (
                  <SelectItem key={st.id} value={st.id.toString()}>
                    {st.movieTitle} - {format(new Date(st.startTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sơ đồ ghế (chỉ hiển thị khi chọn suất chiếu) */}
          {selectedShowtime && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Sơ đồ ghế - {selectedShowtime.movieTitle} ({format(new Date(selectedShowtime.startTime), "dd/MM/yyyy HH:mm", { locale: vi })})
              </h2>
              <SeatMap
                code={selectedShowtime.publicCode}
                showtimeId={selectedShowtime.id}
                selectedSeats={selectedSeats}
                onChange={setSelectedSeats}
                heldBy="STAFF" // Staff session
                setHeldBy={() => {}}
              />
            </div>
          )}

          {/* Form thông tin khách hàng & thanh toán */}
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold">Thông tin khách hàng</h3>
            <Input
              placeholder="Họ tên khách hàng"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
            <Input
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              placeholder="Email (tùy chọn)"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tiền mặt</SelectItem>
                  <SelectItem value="CARD">Thẻ ngân hàng</SelectItem>
                  <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreate}
              disabled={selectedSeats.length === 0 || !selectedShowtime}
              className="w-full md:w-auto"
            >
              Tạo vé ({selectedSeats.length} ghế)
            </Button>
          </div>
        </>
      )}
    </div>
  )
}