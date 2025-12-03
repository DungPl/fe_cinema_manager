// src/app/routes/(admin)/directors/index.tsx
import { useEffect, useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { toast, Toaster } from "sonner"
import { DirectorDialog } from "~/components/director/dialog"
import { getDirector, createDirector, updateDirector, deleteDirectors } from "~/lib/api/directorApi"

import { Skeleton } from "~/components/ui/skeleton"
import { useDebounce } from "use-debounce"
import type { Director } from "~/lib/api/types"
export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Director | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const loadDirectors = async () => {
    setLoading(true)
    try {
      const data: Director[] = await getDirector()
      setDirectors(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Không thể tải dữ liệu đạo diễn")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDirectors()
  }, [])

  const filteredDirectors = useMemo(() => {
    return directors.filter(d =>
      d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (d.biography && d.biography.toLowerCase().includes(debouncedSearch.toLowerCase()))
    )
  }, [directors, debouncedSearch])

  const handleSave = async (form: any) => {
    try {
      if (editing) {
        await updateDirector(editing.id, form)
        toast.success("Cập nhật thành công")
      } else {
        await createDirector(form)
        toast.success("Thêm đạo diễn thành công")
      }
      setDialogOpen(false)
      setEditing(null)
      loadDirectors()
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Xóa ${selectedIds.length} đạo diễn?`)) return

    try {
      await deleteDirectors(selectedIds)
      toast.success("Xóa thành công")
      setSelectedIds([])
      setSelectAll(false)
      loadDirectors()
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
      setSelectedIds(filteredDirectors.map(d => d.id))
    } else {
      setSelectedIds([])
    }
  }, [selectAll, filteredDirectors])

  return (
    <>
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đạo Diễn</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý thông tin các đạo diễn phim</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm đạo diễn
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, tiểu sử..."
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
            Hiển thị <strong>{filteredDirectors.length}</strong> đạo diễn
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
                  <th className="px-6 py-3">Avatar</th>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Quốc tịch</th>
                  <th className="px-6 py-3">Tiểu sử</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDirectors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleSelect(d.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {d.avatar ? (
                        <img src={d.avatar} alt={d.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No avatar</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                    <td className="px-6 py-4 text-gray-600">{d.nationality || "-"}</td>
                    <td className="px-6 py-4 text-gray-600 break-words">{d.biography || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditing(d); setDialogOpen(true) }}
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

            {filteredDirectors.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Không tìm thấy đạo diễn nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog */}
      <DirectorDialog
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