// MovieIndex.tsx – Bản hoàn chỉnh, fix lỗi + hiển thị đầy đủ thông tin
import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "react-hot-toast";
import { getMovies, approveMovie, disableMovie, createMovie } from "~/lib/api/movieApi";
import {UploadTrailerDialog }from "~/components/movie/UploadTrailerDialog";
import  UploadPosterDialog  from "~/components/movie/UploadPosterDialog";
import MovieDetailDialog from "~/components/movie/MovieDetailDialog"
import { CreateMovieDialog } from "~/components/movie/CreateMovieDialog"
export default function MovieIndex() {
    const [movies, setMovies] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<any>(null)
    const [uploadTrailerFor, setUploadTrailerFor] = useState<number | null>(null);
    const [uploadPosterFor, setUploadPosterFor] = useState<number | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // Load movies – ĐÃ FIX CHẮN CHẮN LỖI KHÔNG HIỂN THỊ
    const loadMovies = async () => {
        setLoading(true);
        try {
            const response = await getMovies({ search: debouncedSearch || undefined });

            // Fix: Lấy đúng data từ response (hỗ trợ mọi kiểu apiClient)
            const data = response?.rows || response || [];
            setMovies(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không thể tải danh sách phim");
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovies();
    }, [debouncedSearch]);

    // Helper: Format ngày
    const formatDate = (date: string | null | undefined) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("vi-VN");
    };

    // Helper: Format trạng thái phim
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMING_SOON": return <Badge className="bg-orange-500">Sắp chiếu</Badge>;
            case "NOW_SHOWING": return <Badge className="bg-green-500">Đang chiếu</Badge>;
            case "ENDED": return <Badge variant="secondary">Đã kết thúc</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Helper: Trạng thái duyệt
    const getAvailableStatus = (isAvailable: boolean) => {
        return isAvailable ? (
            <Badge className="bg-green-600 text-white">Đã duyệt</Badge>
        ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ duyệt</Badge>
        );
    };

    const handleApprove = async (id: number) => {
        try {
            await approveMovie(id);
            toast.success("Duyệt phim thành công");
            loadMovies();
        } catch (err: any) {
            toast.error(err?.message || "Không thể duyệt phim");
        }
    };

    const handleDisable = async (id: number) => {
        try {
            await disableMovie({ movieIds: [id] });
            toast.success("Đã vô hiệu hóa phim");
            loadMovies();
        } catch (err: any) {
            toast.error(err?.message || "Không thể vô hiệu hóa");
        }
    };
    const handleSaveMovie = async (formData: FormData) => {
        try {
            // Gọi API tạo phim ở đây (ví dụ: createMovie(formData))
            await createMovie(formData);
            toast.success("Thêm phim thành công!");
            setCreateDialogOpen(false);
            loadMovies();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Thêm phim thất bại");
        }
    };
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Quản lý phim ({movies.length})</h2>
                <Input
                    placeholder="Tìm kiếm tên phim..."
                    className="w-80"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => setCreateDialogOpen(true)}>Thêm phim mới</Button> {/* nút tạo phim */}
            </div>

            <div className="rounded-lg border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left font-medium">Poster</th>
                            <th className="p-4 text-left font-medium">Tên phim</th>
                            <th className="p-4 text-left font-medium">Thể loại</th>
                            <th className="p-4 text-left font-medium">Thời lượng</th>
                            <th className="p-4 text-left font-medium">Khởi chiếu</th>
                            <th className="p-4 text-left font-medium">Trạng thái</th>
                            <th className="p-4 text-left font-medium">Duyệt</th>
                            <th className="p-4 text-left font-medium">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={8} className="text-center py-8">Đang tải danh sách phim...</td>
                            </tr>
                        )}

                        {!loading && movies.length === 0 && (
                            <tr>
                                <td colSpan={8} className="text-center py-12 text-gray-500">
                                    Không tìm thấy phim nào
                                </td>
                            </tr>
                        )}

                        {!loading && movies.map((movie) => (
                            <tr
                                key={movie.id}
                                className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedMovie(movie)}  // Click để xem chi tiết
                            >
                                <td className="p-4">
                                    {movie.posters && movie.posters.length > 0 ? (
                                        <img
                                            src={movie.posters.find((p: any) => p.isPrimary)?.url || movie.posters[0]?.url}
                                            alt={movie.title}
                                            className="w-16 h-20 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="bg-gray-200 border-2 border-dashed rounded w-16 h-20" />
                                    )}
                                </td>

                                <td className="p-4 font-medium">{movie.title}</td>
                                <td className="p-4 text-gray-600">{movie.genre || "-"}</td>
                                <td className="p-4">{movie.duration ? `${movie.duration} phút` : "-"}</td>
                                <td className="p-4">{formatDate(movie.dateRelease)}</td>
                                <td className="p-4">{getStatusBadge(movie.statusMovie)}</td>
                                <td className="p-4">{getAvailableStatus(movie.isAvailable)}</td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        hierarchy
                                        {!movie.isAvailable && (
                                            <Button size="sm" onClick={(e) => {
                                                e.stopPropagation()
                                                handleApprove(movie.id)
                                            }}>
                                                Duyệt
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDisable(movie.id)
                                            }
                                            }
                                        >
                                            Vô hiệu
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={(e) => {
                                            e.stopPropagation()
                                            setUploadPosterFor(movie.id)
                                        }
                                        }>
                                            Poster
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={(e) => {
                                            e.stopPropagation()
                                            setUploadTrailerFor(movie.id)
                                        }
                                        }>
                                            Trailer
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialogs */}
            {uploadTrailerFor && (
                <UploadTrailerDialog
                    movieId={uploadTrailerFor}
                    onClose={() => setUploadTrailerFor(null)}
                    onSuccess={loadMovies}
                     open={true } 
                     oldTrailers={movies.find(m => m.id === uploadTrailerFor)?.trailers ||[]}                />
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
                />
            )}
            <CreateMovieDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSave={handleSaveMovie}
                onSuccess={() => loadMovies()}
            />
        </div>
    );
}