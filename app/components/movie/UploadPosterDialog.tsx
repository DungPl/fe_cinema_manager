// ~/components/movie/UploadPosterDialog.tsx
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { toast } from "react-hot-toast"
import { uploadMoviePosters } from "~/lib/api/movieApi"

interface Props {
  movieId: number
  onClose: () => void
  onSuccess: () => void
}

export default function UploadPosterDialog({ movieId, onClose, onSuccess }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [makePrimary, setMakePrimary] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ảnh")
      return
    }

    setUploading(true)
    try {
      await uploadMoviePosters(movieId, files, makePrimary)
      toast.success(`Đã upload thành công ${files.length} poster!`)
      onSuccess() // reload danh sách phim
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Upload poster thất bại")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Poster cho Phim ID: {movieId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="posters">Chọn nhiều ảnh poster</Label>
            <Input
              id="posters"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const selected = Array.from(e.target.files || [])
                setFiles(selected)
              }}
              className="mt-2"
            />
            {files.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Đã chọn: {files.map(f => f.name).join(", ")}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="primary"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
            />
            <Label htmlFor="primary">Đặt làm poster chính (chỉ áp dụng cho ảnh đầu tiên)</Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? "Đang upload..." : `Upload ${files.length} ảnh`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}