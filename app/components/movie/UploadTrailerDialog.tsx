// ~/components/movie/UploadTrailerDialog.tsx
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { toast } from "react-hot-toast"
import { uploadMovieTrailers } from "~/lib/api/movieApi"

interface Props {
  movieId: number
  onClose: () => void
  onSuccess: () => void
}

export default function UploadTrailerDialog({ movieId, onClose, onSuccess }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [makePrimary, setMakePrimary] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 video")
      return
    }

    setUploading(true)
    try {
      await uploadMovieTrailers(movieId, files, makePrimary)
      toast.success(`Đã gửi ${files.length} trailer để xử lý!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Upload trailer thất bại")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Trailer cho Phim ID: {movieId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="trailers">Chọn nhiều video trailer</Label>
            <Input
              id="trailers"
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/x-m4v"
              onChange={(e) => {
                const selected = Array.from(e.target.files || [])
                setFiles(selected)
              }}
              className="mt-2"
            />
            {files.length > 0 && (
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i}>• {f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)</div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="primary-trailer"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
            />
            <Label htmlFor="primary-trailer">Đặt làm trailer chính</Label>
          </div>

          <p className="text-xs text-amber-600">
            Video sẽ được xử lý nền (có thể mất vài phút). Bạn có thể đóng cửa sổ này.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? "Đang gửi..." : `Gửi ${files.length} video`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}