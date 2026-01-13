// routes/admin/reports/staff-checkin.tsx
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Calendar, Trophy, Eye } from "lucide-react"
import { apiClient } from "~/lib/api/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog"

type StaffReportItem = {
  staffId: number
  fullName: string
  username: string
  phoneNumber: string
  checkInCount: number
  cinemaName: string
}

type StaffReportSummary = {
  totalCheckIns: number
  totalStaff: number
}

type CheckInDetailItem = {
  showtimeId: number
  publicCode: string
  movieTitle: string
  cinemaName: string
  roomName: string
  startTime: string
  checkInCount: number
}

export default function StaffCheckInReportPage() {
  const [report, setReport] = useState<StaffReportItem[]>([])
  const [summary, setSummary] = useState<StaffReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(format(new Date(Date.now() - 7*24*60*60*1000), "yyyy-MM-dd"))
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"))

  // State cho dialog chi tiết
  const [selectedStaff, setSelectedStaff] = useState<StaffReportItem | null>(null)
  const [detailData, setDetailData] = useState<CheckInDetailItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any>(`/report/check-in?from=${from}&to=${to}`)
      setReport(res.data.report || [])
      setSummary(res.data.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (staff: StaffReportItem) => {
    setDetailLoading(true)
    setSelectedStaff(staff)
    setDialogOpen(true)
    try {
      const res = await apiClient.get<any>(`/report/check-in-detail/${staff.staffId}?from=${from}&to=${to}`)
      setDetailData(res.data.details || [])
    } catch (err) {
      console.error(err)
      setDetailData([])
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [from, to])

  const topStaff = report[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Báo cáo Check-in Nhân viên</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <span>đến</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <Button onClick={fetchReport}>
            <Calendar className="w-4 h-4 mr-2" />
            Tải lại
          </Button>
        </div>
      </div>

      {/* Top nhân viên */}
      {topStaff && (
        <Card className="bg-linear-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-sm opacity-90">Nhân viên xuất sắc nhất</p>
              <p className="text-3xl font-bold">{topStaff.fullName}</p>
              <p className="text-lg">{topStaff.cinemaName}</p>
            </div>
            <div className="text-right">
              <Trophy className="w-16 h-16 mx-auto mb-2" />
              <p className="text-4xl font-bold">{topStaff.checkInCount} vé</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tổng số vé đã check-in</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{summary.totalCheckIns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Số nhân viên hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{summary.totalStaff}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bảng xếp hạng nhân viên */}
      <Card>
        <CardHeader>
          <CardTitle>Xếp hạng nhân viên theo số vé check-in</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Đang tải...</p>
          ) : report.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có dữ liệu check-in</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xếp hạng</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Rạp</TableHead>
                  <TableHead className="text-right">Số vé check-in</TableHead>
                  <TableHead className="text-center">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((staff, idx) => (
                  <TableRow key={staff.staffId}>
                    <TableCell className="font-medium">#{idx + 1}</TableCell>
                    <TableCell className="font-medium">{staff.fullName}</TableCell>
                    <TableCell>{staff.username}</TableCell>
                    <TableCell>{staff.phoneNumber || "Chưa cập nhật"}</TableCell>
                    <TableCell>{staff.cinemaName}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {staff.checkInCount} vé
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchDetail(staff)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog chi tiết suất check-in */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết check-in của {selectedStaff?.fullName}
            </DialogTitle>
            <DialogDescription>
              Tổng: {selectedStaff?.checkInCount} vé từ {format(new Date(from), "dd/MM/yyyy")} đến {format(new Date(to), "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {detailLoading ? (
              <p className="text-center py-8">Đang tải chi tiết...</p>
            ) : detailData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Không có dữ liệu chi tiết trong khoảng thời gian này
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã suất</TableHead>
                    <TableHead>Phim</TableHead>
                    <TableHead>Rạp - Phòng</TableHead>
                    <TableHead>Giờ chiếu</TableHead>
                    <TableHead className="text-right">Số vé check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailData.map((item) => (
                    <TableRow key={item.showtimeId}>
                      <TableCell className="font-medium">{item.publicCode}</TableCell>
                      <TableCell>{item.movieTitle}</TableCell>
                      <TableCell>{item.cinemaName} - {item.roomName}</TableCell>
                      <TableCell>{item.startTime}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {item.checkInCount} vé
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}