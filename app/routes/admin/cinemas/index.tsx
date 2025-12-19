import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Search, Building2, Phone, MapPin } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { toast, Toaster } from "sonner"
import { Card } from "~/components/ui/card"
import { CinemaDialog } from "~/components/cinema/dialog"
import {
    getCinemas,
    getCinemaChains,
    createCinema,
    updateCinema,
    deleteCinemas
} from "~/lib/api/cinemaApi"
import type { Cinema, CinemaChain, CinemaListResponse, CreateCinemaInput, UpdateCinemaInput } from "~/lib/api/types"
import { Outlet, useNavigate } from "react-router"

export default function CinemasPage() {
    const [cinemas, setCinemas] = useState<Cinema[]>([])
    const [chains, setChains] = useState<CinemaChain[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Cinema | null>(null)

    const [search, setSearch] = useState("")
    const [selectedChain, setSelectedChain] = useState<string>("all")
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [selectAll, setSelectAll] = useState(false)

    // Pagination
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(5)
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1

    const navigate = useNavigate()
    // Load danh sách rạp
    const loadData = async (page: number, search: string, selectedChain: string) => {
        setLoading(true)
        try {
            const response = await getCinemas({
                page,      // luôn truyền, không dùng pageParam nữa
                limit,     // ← bắt buộc truyền, không để undefined
                searchKey: search.trim() || undefined,
                chainId: selectedChain === "all" ? undefined : Number(selectedChain),
            })

            setCinemas(response.rows)
            setTotal(response.totalCount)

            // Đồng bộ page từ backend nếu có (rất quan trọng để tránh lệch)
            // if (response.page !== undefined) {
            //     setPage(response.page)
            // }
        } catch (err) {
            console.error(err)
            toast.error("Không thể tải danh sách rạp")
            setCinemas([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }


    // Load chuỗi rạp
    const loadChains = async () => {
        try {
            const data = await getCinemaChains()
            setChains([
                { id: 0, name: "Tất cả chuỗi rạp", isActive: true, description: "" },
                ...data.filter(c => c.isActive)
            ])
        } catch (err) {
            console.error("Load chains failed", err)
        }
    }
    // 1. Load chains khi mount
    useEffect(() => {
        loadChains()
    }, [])

    // 2. Reset page khi filter thay đổi
    useEffect(() => {
        setPage(1)
    }, [search, selectedChain])

    // 3. EFFECT DUY NHẤT để load data - FIX 100% mọi lỗi
    useEffect(() => {
        if (chains.length === 0) return // chưa có chains → không gọi API
        loadData(page, search, selectedChain)
    }, [page, search, selectedChain, chains.length])
    // Chọn / bỏ chọn rạp
    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Xóa rạp đã chọn
    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return
        if (!confirm(`Xóa ${selectedIds.length} rạp chiếu phim?`)) return

        try {
            await deleteCinemas(selectedIds)
            toast.success("Xóa thành công!")
            setSelectedIds([])
            setSelectAll(false)
            loadData(page, search, selectedChain)
        } catch {
            toast.error("Xóa thất bại")
        }
    }

    const openCreateDialog = () => {
        setEditing(null)
        setDialogOpen(true)
    }

    const openEditDialog = (cinema: Cinema) => {
        setEditing(cinema)
        setDialogOpen(true)
    }

    const handleSave = async (data: CreateCinemaInput | UpdateCinemaInput) => {
        try {
            if (editing) {
                await updateCinema(editing.id!, data as UpdateCinemaInput)
                toast.success("Cập nhật rạp thành công!")
            } else {
                await createCinema(data as CreateCinemaInput)
                toast.success("Thêm rạp thành công!")
            }
            setDialogOpen(false)
            setEditing(null)
            loadData(page, search, selectedChain) // về trang 1 sau khi thêm/sửa
        } catch (err: any) {
            toast.error(err.message || "Lưu thất bại")
        }
    }

    const firstAddress = (cinema: Cinema) => {
        const addr = cinema.address?.[0]
        if (!addr) return null
        return addr.fullAddress || [
            addr.house_number,
            addr.street,
            addr.ward,
            addr.district,
            addr.province
        ].filter(Boolean).join(", ")
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý Rạp chiếu phim</h1>
                        <p className="text-gray-600 mt-1">Quản lý thông tin các rạp trong hệ thống</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" onClick={handleDeleteSelected}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" /> Thêm rạp mới
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Tìm tên rạp, số điện thoại, địa chỉ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10!"
                            />
                        </div>
                        <select
                            key={selectedChain}
                            value={selectedChain}
                            onChange={(e) => setSelectedChain(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-white min-w-[220px]"
                        >
                            {chains.map(chain => (
                                <option key={chain.id} value={chain.id}>
                                    {chain.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="p-4 border-b">
                        <p className="text-sm text-gray-600">
                            {loading ? (
                                "Đang tải danh sách rạp..."
                            ) : (cinemas?.length ?? 0) === 0 ? (
                                "Không tìm thấy rạp nào phù hợp với bộ lọc."
                            ) : (
                                <>
                                    Hiển thị <strong>{(page - 1) * limit + 1}</strong> -{" "}
                                    <strong>{Math.min(page * limit, total)}</strong> trong tổng{" "}
                                    <strong>{total.toLocaleString("vi-VN")}</strong> rạp
                                </>
                            )}
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-24 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : (cinemas?.length ?? 0) === 0 ? (
                        <div className="p-24 text-center text-gray-500">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>Không tìm thấy rạp nào.</p>
                            <p className="text-sm mt-2">Thử thay đổi bộ lọc hoặc thêm rạp mới.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={(e) => {
                                                        setSelectAll(e.target.checked)
                                                        setSelectedIds(e.target.checked ? cinemas.map(c => c.id!) : [])
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rạp chiếu</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cinemas.map((cinema) => {
                                            const chain = chains.find(c => c.id === cinema.chainId)
                                            const addressText = firstAddress(cinema)

                                            return (
                                                <tr
                                                    key={cinema.id}
                                                    className="hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                                                    onClick={() => {
                                                       //console.log(window.location.pathname)
                                                        navigate(`/admin/cinemas/${cinema.id}/rooms`)
                                                    }} // ← CHUYỂN TRANG KHI CLICK BẤT KỲ ĐÂU TRÊN DÒNG
                                                >
                                                    {/* Checkbox - ngăn không cho click checkbox làm chuyển trang */}
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(cinema.id!)}
                                                            onChange={() => toggleSelect(cinema.id!)}
                                                            className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                                                        />
                                                    </td>

                                                    {/* Thông tin rạp - đẹp lung linh */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="shrink-0">
                                                                {chain?.logoUrl ? (
                                                                    <img
                                                                        src={chain.logoUrl}
                                                                        alt={chain.name}
                                                                        className="w-12 h-12 rounded-xl object-contain bg-white shadow-md border p-1 group-hover:scale-105 transition-transform"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                                        <Building2 className="w-7 h-7 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                    {cinema.name}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-medium text-blue-600">{cinema.roomCount}</span> phòng chiếu • {chain?.name || "Độc lập"}
                                                                </p>
                                                                {cinema.description && (
                                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cinema.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Số điện thoại */}
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {cinema.phone ? (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                {cinema.phone}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">— Chưa có</span>
                                                        )}
                                                    </td>

                                                    {/* Địa chỉ */}
                                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                                        {addressText ? (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                                                <span className="line-clamp-2">{addressText}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Chưa có địa chỉ</span>
                                                        )}
                                                    </td>

                                                    {/* Trạng thái */}
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant={cinema.isActive ? "default" : "secondary"}>
                                                            {cinema.isActive ? "Hoạt động" : "Tạm ngừng"}
                                                        </Badge>
                                                    </td>

                                                    {/* Nút sửa - ngăn chuyển trang khi click */}
                                                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditDialog(cinema)}
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {total > 0 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                                    <div className="text-sm text-gray-700">
                                        Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong tổng{" "}
                                        <strong>{total}</strong> rạp
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1 || loading}>First</Button>
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Previous</Button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum: number
                                            if (totalPages <= 5) pageNum = i + 1
                                            else if (page <= 3) pageNum = i + 1
                                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                                            else pageNum = page - 2 + i

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(pageNum)}
                                                    disabled={loading}
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}

                                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Next</Button>
                                        <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages || loading}>Last</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            <CinemaDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditing(null)
                }}
                onSubmit={handleSave}
                initialData={editing ?? undefined}
                chains={chains.filter(c => c.id !== 0)}
            />
             {/* <Outlet /> */}
        </>
    )
}