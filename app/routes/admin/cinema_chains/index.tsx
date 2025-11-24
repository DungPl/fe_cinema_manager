// src/app/routes/(admin)/cinema_chains/index.tsx
import { useEffect, useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { toast, Toaster } from "sonner"
import { CinemaChainDialog } from "~/components/cinema_chain/dialog"
import { getCinemaChains, createCinemaChain, updateCinemaChain, deleteCinemaChains } from "~/lib/api/cinemaChainApi"

import { Skeleton } from "~/components/ui/skeleton"
import { useDebounce } from "use-debounce"
import { toBoolean } from "~/lib/utils"
import type { CinemaChain } from "~/lib/api/types"
export default function CinemaChainsPage() {
  const [chains, setChains] = useState<CinemaChain[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CinemaChain | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  // ← ĐƯA VÀO ĐÂY
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const loadChains = async () => {
    setLoading(true)
    try {
      const data: CinemaChain[] = await getCinemaChains()  // ← Đã có kiểu
      setChains(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Không thể tải dữ liệu chuỗi rạp")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChains()
  }, [])

  const filteredChains = useMemo(() => {
    return chains.filter(c =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [chains, debouncedSearch])

  const handleSave = async (form: any) => {
    try {
      if (editing) {
        await updateCinemaChain(editing.id, form)
        toast.success("Cập nhật thành công")
      } else {
        await createCinemaChain(form)
        toast.success("Thêm chuỗi rạp thành công")
      }
      setDialogOpen(false)
      setEditing(null)
      loadChains()
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Xóa ${selectedIds.length} chuỗi rạp?`)) return

    try {
      await deleteCinemaChains(selectedIds)
      toast.success("Xóa thành công")
      setSelectedIds([])
      setSelectAll(false)
      loadChains()
    } catch {
      toast.error("Xóa thất bại")
    }
  }

  // Toggle chọn 1 dòng
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Chọn tất cả
  useEffect(() => {
    if (selectAll) {
      setSelectedIds(filteredChains.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }, [selectAll, filteredChains])

  return (
    <>
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chuỗi Rạp</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý thông tin các chuỗi rạp chiếu phim</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm chuỗi rạp
          </Button>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Thêm chuỗi rạp
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Card Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Hiển thị <strong>{filteredChains.length}</strong> chuỗi rạp
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3">Logo</th>
                  <th className="px-6 py-3">Tên chuỗi</th>
                  <th className="px-6 py-3">Mô tả</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChains.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} className="w-12 h-12 object-contain rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No logo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-gray-600 break-words">{c.description || "-"}</td>

                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={toBoolean(c.isActive)
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {toBoolean(c.isActive) ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditing(c); setDialogOpen(true) }}
                          className="hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredChains.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Không tìm thấy chuỗi rạp nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog */}
      <CinemaChainDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        onSave={handleSave}
        initialData={editing}
      />
    </>
  )
}

// Skeleton khi loading
function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}