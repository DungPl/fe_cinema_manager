// routes/admin/reports/no-show-detail.tsx
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Calendar } from "lucide-react"
import { apiClient } from "~/lib/api/client"

type NoShowDetailItem = {
  showtimeId: number
  publicCode: string
  movieTitle: string
  cinemaName: string
  roomName: string
  startTime: string
  totalTickets: number
  checkInTickets: number
  noShowTickets: number
  noShowRate: number
  estimatedLoss: number
}

type Summary = {
  averageNoShowRate: number
  totalNoShowTickets: number
  totalLoss: number
}

export default function NoShowDetailReport() {
  const [data, setData] = useState<NoShowDetailItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(format(new Date(Date.now() - 7*24*60*60*1000), "yyyy-MM-dd"))
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"))

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any>(`/report/no-show?from=${from}&to=${to}`)
      const payload = res.data
      setData(payload.report || [])
      setSummary(payload.summary || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [from, to])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Báo cáo No-Show chi tiết theo suất chiếu</h2>
        <div className="flex items-center gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-3 py-2" />
          <span>đến</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-3 py-2" />
          <Button onClick={fetchData}><Calendar className="w-4 h-4 mr-2" />Tải lại</Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tỷ lệ No-Show trung bình</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-red-600">{summary.averageNoShowRate.toFixed(1)}%</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tổng vé No-Show</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-red-600">{summary.totalNoShowTickets} vé</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cơ hội doanh thu mất</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-orange-600">{summary.totalLoss.toLocaleString()}đ</p></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suất chiếu bị mất cơ hội doanh thu nhiều nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Đang tải...</p>
          ) : data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có suất nào bị no-show trong khoảng thời gian này</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã suất</TableHead>
                  <TableHead>Phim</TableHead>
                  <TableHead>Rạp - Phòng</TableHead>
                  <TableHead>Giờ chiếu</TableHead>
                  <TableHead>Vé bán</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>No-Show</TableHead>
                  <TableHead>Tỷ lệ</TableHead>
                  <TableHead className="text-right">Mất cơ hội</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.showtimeId}>
                    <TableCell className="font-medium">{item.publicCode}</TableCell>
                    <TableCell>{item.movieTitle}</TableCell>
                    <TableCell>{item.cinemaName} - {item.roomName}</TableCell>
                    <TableCell>{item.startTime}</TableCell>
                    <TableCell>{item.totalTickets}</TableCell>
                    <TableCell>{item.checkInTickets}</TableCell>
                    <TableCell className="text-red-600 font-medium">{item.noShowTickets}</TableCell>
                    <TableCell className={item.noShowRate > 20 ? "text-red-600" : ""}>
                      {item.noShowRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">
                      {item.estimatedLoss.toLocaleString()}đ
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}