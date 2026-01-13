// routes/staff/checkin.tsx
import { useEffect, useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"
import { AlertCircle, XCircle, CheckCircle2 } from "lucide-react"

interface CheckinResponse {
    message: string
    orderCode: string
    customer_name: string
    movie: string
    showtime: string
    room: string
    seats: string
    ticketCount: number
    checked_in_at: string
}

export default function CheckinPage() {
    const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checking, setChecking] = useState(false)
    const [scannerPaused, setScannerPaused] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const handleScan = async (code: string) => {
        if (!code || checking || scannerPaused) return

        setChecking(true)
        setCheckinResult(null)
        setErrorMessage(null)

        try {
            const res = await apiClient.post<{ data: CheckinResponse }>("/staff/ticket/checkin", {
                code: code.trim(),
            })

            setCheckinResult(res.data)
            toast.success(res.data.message)

            // Âm thanh thành công (tùy chọn)
            new Audio("/sounds/success-beep.mp3").play().catch(() => { })
            setScannerPaused(true)
            setTimeout(() => {
                setScannerPaused(false)
                setCheckinResult(null) // optional: xóa kết quả cũ để sạch màn hình
            }, 10000)
        } catch (err: any) {
            const msg = err.response?.data?.message || "Mã QR không hợp lệ hoặc lỗi hệ thống"
            setErrorMessage(msg)
            toast.error(msg)

            // Âm thanh lỗi (tùy chọn)
            new Audio("/sounds/error-beep.mp3").play().catch(() => { })
        } finally {
            setChecking(false)
        }
    }
    useEffect(() => {
        if (scannerPaused) {
            setCountdown(10)
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setScannerPaused(false)
                        setCheckinResult(null)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [scannerPaused])
    // routes/staff/checkin.tsx
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
                    Check-in vé bằng QR
                </h1>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* === PHẦN KẾT QUẢ - HIỂN THỊ NGAY TRÊN CÙNG === */}
                    {checkinResult && (
                        <div className="bg-green-50 border-b-4 border-green-500 p-10 text-center">
                            <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-6" />
                            <h2 className="text-4xl font-bold text-green-700 mb-6">
                                CHECK-IN THÀNH CÔNG
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-lg">
                                <div className="space-y-4 text-left">
                                    <p><strong>🎬 Phim:</strong> {checkinResult.movie}</p>
                                    <p><strong>🏛 Phòng:</strong> {checkinResult.room}</p>
                                    <p><strong>⏰ Suất chiếu:</strong> {checkinResult.showtime}</p>
                                </div>
                                <div className="space-y-4 text-left">
                                    <p><strong>💺 Ghế:</strong> <span className="font-bold text-primary text-xl">{checkinResult.seats}</span></p>
                                    <p><strong>🎟 Số vé:</strong> <span className="font-bold text-xl">{checkinResult.ticketCount}</span> vé</p>
                                </div>
                            </div>

                            <p className="text-center text-gray-600 mt-8 text-sm">
                                <strong>Check-in lúc:</strong> {checkinResult.checked_in_at}
                            </p>
                            <div className="absolute top-4 right-4 bg-white/90 px-4 py-2 rounded-full shadow">
                                <p className="text-sm font-medium text-gray-700">
                                    Sẵn sàng quét vé tiếp theo sau <strong>10 giây</strong>
                                </p>
                            </div>

                        </div>

                    )}

                    {errorMessage && (
                        <div className="bg-red-50 border-b-4 border-red-500 p-10 text-center">
                            <XCircle className="w-24 h-24 text-red-600 mx-auto mb-6" />
                            <h2 className="text-4xl font-bold text-red-700 mb-6">
                                CHECK-IN THẤT BẠI
                            </h2>
                            <p className="text-xl text-red-800 font-medium max-w-2xl mx-auto">
                                {errorMessage}
                            </p>
                            <p className="text-gray-600 mt-4">
                                Vui lòng kiểm tra lại mã QR hoặc liên hệ quản lý.
                            </p>
                        </div>
                    )}

                    {/* === CAMERA QUÉT QR - ĐẶT Ở DƯỚI KẾT QUẢ === */}
                    {/* === CAMERA QUÉT QR === */}
                    <div className="p-10">
                        <div className={`border-4 rounded-2xl p-8 bg-gray-50 transition-all ${scannerPaused ? 'border-gray-300 opacity-60' : 'border-dashed border-gray-400'}`}>
                            {/* CHỈ RENDER SCANNER KHI KHÔNG PAUSE */}
                            {!scannerPaused && (
                                <Scanner
                                    onScan={(result) => {
                                        if (result?.[0]?.rawValue) {
                                            handleScan(result[0].rawValue.trim())
                                        }
                                    }}
                                    onError={(err) => console.error(err)}
                                    constraints={{ facingMode: "environment" }}
                                    classNames={{
                                        container: "w-full",
                                        video: "w-full h-full object-cover rounded-xl",
                                    }}
                                />
                            )}

                            {/* KHI PAUSE – HIỂN THỊ THÔNG BÁO + COUNTDOWN */}
                            {scannerPaused && (
                                <div className="flex flex-col items-center justify-center h-96 text-gray-600">
                                    <div className="text-6xl mb-4">⏳{countdown}</div>
                                    <p className="text-2xl font-bold mb-2">Tạm dừng quét</p>
                                    <p className="text-lg">Sẵn sàng quét vé tiếp theo sau 10 giây</p>
                                    <p className="text-sm mt-4">Nhân viên vui lòng kiểm tra thông tin khách</p>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-gray-600 text-lg mt-8">
                            {scannerPaused
                                ? "Đang tạm dừng – sẵn sàng sau vài giây"
                                : "Hướng camera vào mã QR trên vé của khách"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}