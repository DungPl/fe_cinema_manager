// ~/components/movie/MovieDetailDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "~/components/ui/carousel"
import { format } from "date-fns"
import { Play, Calendar, Clock, Globe, Users, Film } from "lucide-react"
import { useEffect, useState } from "react"
import EditMovieDialog from "./EditMovieDialog"
import { getMovieById } from "~/lib/api/movieApi"

interface MovieDetailDialogProps {
    movie: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function MovieDetailDialog({ movie, open, onOpenChange, onSuccess }: MovieDetailDialogProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [currentMovie, setCurrentMovie] = useState(movie)
    if (!movie) return null

    const formatDate = (date: string | null | undefined) => {
        if (!date) return "Chưa xác định"
        return format(new Date(date), "dd/MM/yyyy")
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "COMING_SOON": return { text: "Sắp chiếu", color: "bg-orange-500" }
            case "NOW_SHOWING": return { text: "Đang chiếu", color: "bg-green-500" }
            case "ENDED": return { text: "Đã kết thúc", color: "bg-gray-500" }
            default: return { text: status, color: "bg-gray-400" }
        }
    }

    const status = getStatusText(movie.statusMovie)
    useEffect(() => {
        setCurrentMovie(movie)
    }, [movie])

    const handleEditSuccess = async () => {
        try {
            const res = await getMovieById(currentMovie.id)
            setCurrentMovie(res)
            if (onSuccess) onSuccess()

            // ⛔ CHỐT QUAN TRỌNG: đóng dialog sau khi cập nhật
            setEditOpen(false)
            onOpenChange(false)
        } catch (err) {
            console.error("Không tải lại phim:", err)
        }
    }
    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) {
                setEditOpen(false)
                onOpenChange(false)
            }
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{currentMovie.title}</DialogTitle>
                    <Button onClick={() => setEditOpen(true)}>Sửa phim</Button>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Cột trái: Poster + Trailer */}
                    <div className="space-y-4">
                        {/* Poster Carousel */}
                        {currentMovie.posters && currentMovie.posters.length > 0 ? (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {currentMovie.posters.map((currentMovie: any, idx: number) => (
                                        <CarouselItem key={idx}>
                                            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                                                <img
                                                    src={currentMovie.url}
                                                    alt={`Poster ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {currentMovie.isPrimary && (
                                                    <Badge className="absolute top-2 right-2">Chính</Badge>
                                                )}
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {currentMovie.posters.length > 1 && (
                                    <>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </>
                                )}
                            </Carousel>
                        ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full aspect-[2/3] flex items-center justify-center">
                                <span className="text-gray-500">Chưa có poster</span>
                            </div>
                        )}

                        {/* Trailer */}
                        {currentMovie.trailers && currentMovie.trailers.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Play className="w-5 h-5" /> Trailer
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {currentMovie.trailers.map((trailer: any, idx: number) => (
                                        <div key={idx} className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                            <video
                                                src={trailer.url}
                                                controls
                                                className="w-full h-full"
                                                poster={currentMovie.posters?.[0]?.url}
                                            />
                                            {currentMovie.isPrimary && (
                                                <Badge className="absolute top-2 left-2">Chính</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cột phải: Thông tin chi tiết */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Trạng thái */}
                        <div className="flex flex-wrap gap-3">
                            <Badge className={status.color}>{status.text}</Badge>
                            <Badge variant={currentMovie.isAvailable ? "default" : "secondary"}>
                                {currentMovie.isAvailable ? "Đã duyệt" : "Chờ duyệt"}
                            </Badge>
                            <Badge variant="outline">{currentMovie.ageRestriction}</Badge>
                        </div>

                        {/* Thông tin cơ bản */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Khởi chiếu:</span>
                                <span>{formatDate(currentMovie.dateRelease)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Thời lượng:</span>
                                <span>{currentMovie.duration} phút</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Ngôn ngữ:</span>
                                <span>{currentMovie.language || "Không rõ"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Film className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Thể loại:</span>
                                <span>{currentMovie.genre || "Không rõ"}</span>
                            </div>
                        </div>

                        {/* Mô tả */}
                        <div>
                            <h4 className="font-semibold mb-2">Mô tả phim</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {currentMovie.description || "Chưa có mô tả"}
                            </p>
                        </div>

                        {/* Đạo diễn */}
                        {currentMovie.director && (
                            <div>
                                <h4 className="font-semibold mb-2">Đạo diễn</h4>
                                <p className="text-sm">{currentMovie.director.name || currentMovie.director.fullName}</p>
                            </div>
                        )}

                        {/* Diễn viên */}
                        {/* Diễn viên */}
                        {currentMovie.actors && currentMovie.actors.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5" /> Diễn viên
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {currentMovie.actors.map((actor: any) => (
                                        <div key={actor.id} className="text-center">
                                            {actor.avatar ? (
                                                <img
                                                    src={actor.avatar}
                                                    alt={actor.name || actor.fullName}
                                                    className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                    <Users className="w-10 h-10 text-gray-500" />
                                                </div>
                                            )}
                                            <p className="text-sm font-medium">{actor.name || actor.fullName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Định dạng chiếu */}
                        {currentMovie.formats && currentMovie.formats.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Định dạng</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentMovie.formats.map((f: any) => (
                                        <Badge key={f.id} variant="outline">
                                            {f.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EditMovieDialog */}

                        <EditMovieDialog
                            movie={currentMovie}
                            open={editOpen}
                            onOpenChange={setEditOpen}
                            onSuccess={handleEditSuccess}
                        />


                        {/* Thông tin thêm */}
                        <div>
                            Tạo:{" "}
                            {currentMovie?.createdAt
                                ? format(new Date(currentMovie.createdAt), "HH:mm dd/MM/yyyy")
                                : "—"}
                        </div>

                        <div>
                            Cập nhật:{" "}
                            {currentMovie?.updatedAt
                                ? format(new Date(currentMovie.updatedAt), "HH:mm dd/MM/yyyy")
                                : "—"}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
