// src/pages/admin/StaffManagementPage.tsx
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Pencil, Lock, Unlock, Trash2, UserPlus } from "lucide-react"
import { apiClient } from "~/lib/api/client"
import { cn } from "~/lib/utils"
import type { StaffWithAccount } from "~/lib/api/types"

// Import các dialog
import { CreateStaffDialog } from "~/components/staff/StaffDialogs"
import { EditStaffDialog } from "~/components/staff/StaffDialogs"


export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState<StaffWithAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffWithAccount | null>(null)

  const total = staffs.length
  const activeCount = staffs.filter((s) => s.account?.active).length
  const inactiveCount = total - activeCount
  const adminCount = staffs.filter((s) => s.account?.role === "ADMIN").length

  const fetchStaffs = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any>("/staff")
      setStaffs(res.data.rows || [])
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err)
      toast.error("Không thể tải danh sách nhân viên")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffs()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa nhân viên này?")) return
    try {
      await apiClient.delete(`/staff/${id}`)
      toast.success("Đã xóa nhân viên")
      fetchStaffs()
    } catch (err) {
      toast.error("Xóa thất bại")
    }
  }

  const toggleActive = async (accountId: number, currentActive: boolean) => {
    try {
      await apiClient.patch(`/account/${accountId}/toggle-active`, {
        active: !currentActive,
      })
      toast.success(`Tài khoản đã ${currentActive ? "bị khóa" : "được kích hoạt"}`)
      fetchStaffs()
    } catch (err) {
      toast.error("Thao tác thất bại")
    }
  }

  const filteredStaffs = staffs.filter((staff) => {
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      staff.firstname.toLowerCase().includes(q) ||
      staff.lastname.toLowerCase().includes(q) ||
      staff.phoneNumber.includes(q) ||
      (staff.account?.username?.toLowerCase() || "").includes(q)

    const matchRole = roleFilter === "all" || staff.account?.role === roleFilter
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && staff.account?.active) ||
      (statusFilter === "inactive" && !staff.account?.active)

    return matchSearch && matchRole && matchStatus
  })

  const handleOpenEdit = (staff: StaffWithAccount) => {
    setSelectedStaff(staff)
    setOpenEdit(true)
  }

  return (
    <div className="container space-y-8 py-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Tổng nhân viên" value={total} color="blue" />
        <SummaryCard title="Đang hoạt động" value={activeCount} color="green" />
        <SummaryCard title="Không hoạt động" value={inactiveCount} color="red" />
        <SummaryCard title="Quản trị viên" value={adminCount} color="purple" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quản lý nhân viên</CardTitle>
            <CardDescription>Quản lý thông tin và tài khoản nhân viên</CardDescription>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Button>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <Input
              placeholder="Tìm theo tên, username, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                <SelectItem value="MANAGER">Quản lý</SelectItem>
                <SelectItem value="MODERATOR">Kiểm duyệt</SelectItem>
                <SelectItem value="SELLER">Nhân viên bán vé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
          ) : filteredStaffs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Không tìm thấy nhân viên phù hợp
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái TK</TableHead>
                    <TableHead>Rạp</TableHead>
                    <TableHead className="w-32 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffs.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="font-medium">
                          {staff.firstname} {staff.lastname}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {staff.account?.username ? `@${staff.account.username}` : "Chưa có TK"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{staff.phoneNumber}</div>
                        <div className="text-xs text-muted-foreground">{staff.email || "—"}</div>
                      </TableCell>
                      <TableCell>
                        {staff.account?.role ? (
                          <Badge variant="secondary">{staff.account.role}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {staff.account ? (
                          <Badge
                            variant={staff.account.active ? "default" : "destructive"}
                            className={cn(
                              staff.account.active
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            )}
                          >
                            {staff.account.active ? "Hoạt động" : "Đã khóa"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Chưa có</Badge>
                        )}
                      </TableCell>
                      <TableCell>{staff.account?.cinema?.name || "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(staff)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {staff.account && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive(staff.account!.id, staff.account!.active)}
                          >
                            {staff.account.active ? (
                              <Lock className="h-4 w-4 text-red-600" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleDelete(staff.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateStaffDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => {
          setOpenCreate(false)
          fetchStaffs()
        }}
      />

      <EditStaffDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        staff={selectedStaff}
        onSuccess={() => {
          setOpenEdit(false)
          setSelectedStaff(null)
          fetchStaffs()
        }}
      />
    </div>
  )
}

// Component nhỏ cho summary cards
function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
  const bgClass = {
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-800",
    green: "from-green-50 to-green-100 border-green-200 text-green-800",
    red: "from-red-50 to-red-100 border-red-200 text-red-800",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-800",
  }[color]

  return (
    <Card className={`bg-linear-to-br ${bgClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}