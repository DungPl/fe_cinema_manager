// routes/staff/checkin.tsx
import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"

interface CheckinResponse {
    message: string
    customer_name: string
    movie: string
    ticketCode: string
    showtime: string

}
interface ApiResponse<T> {
    status: string
    data: T
    message?: string
}
export default function CheckinPage() {
    const [result, setResult] = useState("")
    const [checking, setChecking] = useState(false)

    const handleScan = async (code: string) => {
        if (!code || checking) return

        setResult(code)
        setChecking(true)

        try {
            const res = await apiClient.post<ApiResponse<CheckinResponse>>(
                "/staff/ticket/checkin",
                { code }
            )

            toast.success(
                `Check-in thành công!\nVé: ${res.data.ticketCode}\nKhách: ${res.data.customer_name}`
            )
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Vé không hợp lệ hoặc đã check-in")
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Check-in vé bằng QR
                </h1>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="border-4 border-dashed border-gray-300 rounded-xl p-4 mb-6">
                        <Scanner
                            onScan={(result) => {
                                if (result?.[0]?.rawValue) {
                                    handleScan(result[0].rawValue.trim())
                                }
                            }}
                            onError={(err) => console.error(err)}
                            constraints={{ facingMode: "environment" }}
                        />
                    </div>

                    <p className="text-center text-gray-600">
                        Hướng camera vào mã QR trên vé
                    </p>

                    {result && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                            <p className="font-medium">Mã vé vừa quét:</p>
                            <p className="text-2xl font-bold text-blue-900">{result}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
