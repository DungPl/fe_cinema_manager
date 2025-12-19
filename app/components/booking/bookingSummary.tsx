// components/booking/BookingSummary.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Showtime, BookingSeat } from "~/lib/api/types";

export default function BookingSummary({
  code,
  showtime,
  selectedSeats,
  heldBy,
}: {
  code: string;
  showtime: Showtime;
  selectedSeats: BookingSeat[];
  heldBy: string;
}) {
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tính toán giá
  const calculatePrice = () => {
    let total = 0;
    selectedSeats.forEach(seat => {
      total += seat.type === "VIP" ? 60000 : seat.type === "COUPLE" ? 120000 : 50000; // Giả sử giá
    });
    // Áp dụng discount nếu có
    return total; // TODO: Xử lý discount thực tế
  };

  const handleProceedToPayment = () => {
    if (!name || !phone || !email) {
      setError("Vui lòng điền đầy đủ thông tin cá nhân");
      return;
    }
    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất một ghế");
      return;
    }

    // Lưu thông tin tạm thời (ví dụ: localStorage hoặc context) để dùng ở trang payment
    const paymentInfo = {
      code,
      showtimeId: showtime.id,
      selectedSeats: selectedSeats.map(s => s.id),
      heldBy,
      name,
      phone,
      email,
      discountCode,
    };
    localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo));

    // Chuyển đến trang thanh toán
    navigate(`/payment/${code}`);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Tóm tắt đơn hàng</h3>

      {/* Hiển thị ghế đã chọn */}
      <div>
        Ghế: {selectedSeats.map(s => s.label).join(", ")}
      </div>

      {/* Tính toán giá */}
      <div>Tổng: {calculatePrice().toLocaleString()} đ</div>

      {/* Form mã giảm giá */}
      <input
        type="text"
        placeholder="Nhập mã giảm giá"
        value={discountCode}
        onChange={e => setDiscountCode(e.target.value)}
        className="w-full p-2 border"
      />

      {/* Form thông tin cá nhân */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Họ và tên"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border"
        />
        <input
          type="tel"
          placeholder="Số điện thoại"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full p-2 border"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border"
        />
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <button
        onClick={handleProceedToPayment}
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Thanh toán
      </button>
    </div>
  );
}