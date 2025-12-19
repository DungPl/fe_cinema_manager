import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { purchaseSeats } from "~/lib/api/showtimeApi"

interface PaymentDraft {
  seatIds: number[]
  heldBy: string
}

export default function PaymentPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<PaymentDraft | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ================= LOAD GHẾ ĐÃ GIỮ ================= */
  useEffect(() => {
    const raw = localStorage.getItem("paymentDraft")
    if (!raw) {
      setError("Không tìm thấy thông tin ghế đã giữ")
      return
    }
    setDraft(JSON.parse(raw))
  }, [])

  /* ================= SUBMIT ================= */
  const handlePayment = async () => {
    if (!draft) return

    if (!name || !phone || !email) {
      alert("Vui lòng nhập đầy đủ thông tin")
      return
    }

    setLoading(true)
    try {
      await purchaseSeats(code!, {
        seatIds: draft.seatIds,
        heldBy: draft.heldBy,
        name,
        phone,
        email,
      })

      localStorage.removeItem("paymentDraft")
      navigate("/success")
    } catch (err) {
      setError("Thanh toán thất bại. Ghế có thể đã hết hạn.")
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!draft) return <div>Đang tải...</div>

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-bold text-center">
        Thông tin thanh toán
      </h2>

      <input
        className="w-full border p-2 rounded"
        placeholder="Họ và tên"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Số điện thoại"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <div className="text-sm text-gray-600">
        Ghế đã chọn: {draft.seatIds.join(", ")}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-green-600 text-white p-2 rounded"
      >
        {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
      </button>
    </div>
  )
}
