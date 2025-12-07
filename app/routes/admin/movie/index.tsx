// MovieIndex.tsx – Bản hoàn chỉnh, với multi-select để vô hiệu hóa
import { useEffect, useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { toast } from "react-hot-toast"
import { getMovies, approveMovie, disableMovie, createMovie } from "~/lib/api/movieApi"
import { UploadTrailerDialog } from "~/components/movie/UploadTrailerDialog"
import UploadPosterDialog from "~/components/movie/UploadPosterDialog"
import MovieDetailDialog from "~/components/movie/MovieDetailDialog"
import { CreateMovieDialog } from "~/components/movie/CreateMovieDialog"
import { Skeleton } from "~/components/ui/skeleton"
import { useDebounce } from "use-debounce"

export default function MovieIndex() {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [uploadTrailerFor, setUploadTrailerFor] = useState<number | null>(null)
  const [uploadPosterFor, setUploadPosterFor] = useState<number | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const loadMovies = async () => {
    setLoading(true)
    try {
      const response = await getMovies({ search: debouncedSearch || undefined })
      const data = response?.rows || response || []
      setMovies(Array.isArray(data) ? data : [])
      setSelectedMovie(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tải danh sách phim")
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [debouncedSearch])

  const filteredMovies = useMemo(() => {
    return movies.filter((m: any) =>
      m.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.genre?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [movies, debouncedSearch])

  // Helper: Format ngày
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("vi-VN")
  }

  // Helper: Format trạng thái phim
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMING_SOON": return <Badge className="bg-orange-500">Sắp chiếu</Badge>
      case "NOW_SHOWING": return <Badge className="bg-green-500">Đang chiếu</Badge>
      case "ENDED": return <Badge variant="secondary">Đã kết thúc</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  // Helper: Trạng thái duyệt
  const getAvailableStatus = (isAvailable: boolean) => {
    return isAvailable ? (
      <Badge className="bg-green-600 text-white">Đã duyệt</Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ duyệt</Badge>
    )
  }

  const handleApprove = async (id: number) => {
    try {
      await approveMovie(id)
      toast.success("Duyệt phim thành công")
      loadMovies()
    } catch (err: any) {
      toast.error(err?.message || "Không thể duyệt phim")
    }
  }

  const handleDisableSelected = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Vô hiệu hóa ${selectedIds.length} phim?`)) return

    try {
      await disableMovie({ ids: selectedIds })
      toast.success("Vô hiệu hóa thành công")
      setSelectedIds([])
      setSelectAll(false)
      loadMovies()
    } catch {
      toast.error("Vô hiệu hóa thất bại")
    }
  }

  const handleSaveMovie = async (formData: FormData) => {
    try {
      await createMovie(formData)
      toast.success("Thêm phim thành công!")
      setCreateDialogOpen(false)
      loadMovies()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thêm phim thất bại")
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
      setSelectedIds(filteredMovies.map((m: any) => m.id))
    } else {
      setSelectedIds([])
    }
  }, [selectAll, filteredMovies])

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phim</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý thông tin các phim</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDisableSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Vô hiệu ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm phim mới
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, thể loại..."
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
            Hiển thị <strong>{filteredMovies.length}</strong> phim
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
                  <th className="px-6 py-3">Poster</th>
                  <th className="px-6 py-3">Tên phim</th>
                  <th className="px-6 py-3">Thể loại</th>
                  <th className="px-6 py-3">Thời lượng</th>
                  <th className="px-6 py-3">Khởi chiếu</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Duyệt</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovies.map((movie: any) => (
                  <tr
                    key={movie.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(movie.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelect(movie.id)
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {movie.posters && movie.posters.length > 0 ? (
                        <img
                          src={movie.posters.find((p: any) => p.isPrimary)?.url || movie.posters[0]?.url}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-18 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No poster</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{movie.title}</td>
                    <td className="px-6 py-4 text-gray-600">{movie.genre || "-"}</td>
                    <td className="px-6 py-4">{movie.duration ? `${movie.duration} phút` : "-"}</td>
                    <td className="px-6 py-4">{formatDate(movie.dateRelease)}</td>
                    <td className="px-6 py-4">{getStatusBadge(movie.statusMovie)}</td>
                    <td className="px-6 py-4">{getAvailableStatus(movie.isAvailable)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {!movie.isAvailable && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(movie.id)
                            }}
                            className="hover:bg-blue-50"
                          >
                            Duyệt
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadPosterFor(movie.id)
                          }}
                        >
                          Poster
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadTrailerFor(movie.id)
                          }}
                        >
                          Trailer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMovies.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Không tìm thấy phim nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {uploadTrailerFor && (
        <UploadTrailerDialog
          movieId={uploadTrailerFor}
          onClose={() => setUploadTrailerFor(null)}
          onSuccess={loadMovies}
          open={true}
          oldTrailers={movies.find(m => m.id === uploadTrailerFor)?.trailers || []}
        />
      )}
      {uploadPosterFor && (
        <UploadPosterDialog
          open={true}
          movieId={uploadPosterFor}
          oldPosters={movies.find(m => m.id === uploadPosterFor)?.posters || []}
          onClose={() => setUploadPosterFor(null)}
          onSuccess={loadMovies}
        />
      )}
      {selectedMovie && (
        <MovieDetailDialog
          movie={selectedMovie}
          open={!!selectedMovie}
          onOpenChange={(open) => !open && setSelectedMovie(null)}
          onSuccess={loadMovies}
        />
      )}
      <CreateMovieDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleSaveMovie}
        onSuccess={() => loadMovies()}
      />
    </div>
  )
}

// Skeleton khi loading
function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="w-12 h-18 rounded-lg" />
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