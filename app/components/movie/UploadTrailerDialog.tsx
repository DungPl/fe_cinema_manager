// ~/components/movie/UploadTrailerDialog.tsx

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { X, Star, Video } from "lucide-react"
import axios from "axios"

type Props = {
  open: boolean
  movieId: number
  oldTrailers: { id: number; url: string; is_primary: boolean }[]
  onClose: () => void
  onSuccess?: () => Promise<void>
}

type PrimaryTrailer =
  | { type: "old"; id: number }
  | { type: "new"; index: number }
  | null

type UploadProgress = { [index: number]: number }

export function UploadTrailerDialog({
  open,
  movieId,
  oldTrailers,
  onClose,
  onSuccess,
}: Props) {
  const [preview, setPreview] = useState<{ url: string; file: File }[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])
  const [primaryTrailer, setPrimaryTrailer] = useState<PrimaryTrailer>(
    oldTrailers.find((t) => t.is_primary)
      ? { type: "old", id: oldTrailers.find((t) => t.is_primary)!.id }
      : null
  )
  const [progress, setProgress] = useState<UploadProgress>({})
  const [uploading, setUploading] = useState(false)

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const list = [...preview]

    for (let i = 0; i < e.target.files.length; i++) {
      const f = e.target.files[i]
      list.push({ url: URL.createObjectURL(f), file: f })
    }

    setPreview(list)
  }

  const removeOld = (id: number) => {
    setRemovedIds((prev) => [...prev, id])
    if (primaryTrailer?.type === "old" && primaryTrailer.id === id) {
      setPrimaryTrailer(null)
    }
  }

  const removeNew = (index: number) => {
    const list = [...preview]
    list.splice(index, 1)
    setPreview(list)

    if (primaryTrailer?.type === "new") {
      if (primaryTrailer.index === index) setPrimaryTrailer(null)
      else if (primaryTrailer.index > index)
        setPrimaryTrailer({ type: "new", index: primaryTrailer.index - 1 })
    }
  }

  /** --------------------------------------
   *  UPLOAD TRAILER
   * --------------------------------------*/
   const handleSave = async () => {
    setUploading(true)
    const uploadedTrailers: { url: string; publicId: string }[] = []
    const failed: string[] = []

    for (let idx = 0; idx < preview.length; idx++) {
      const { file } = preview[idx]

      try {
        const publicId = `movie_${movieId}_trailer_${Date.now()}_${idx}`

        // 1. Lấy chữ ký Cloudinary (backend đã sửa đúng format)
        const sigRes = await fetch('/api/v1/cloudinary-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: "movies/trailers",
            public_id: publicId,
            resource_type: "video"
          })
        })

        const sigData = await sigRes.json()

        // 2. Upload video lên Cloudinary
        const fd = new FormData()
        fd.append("file", file)
        fd.append("api_key", sigData.apiKey)
        fd.append("timestamp", sigData.timestamp.toString())
        fd.append("signature", sigData.signature)
        fd.append("folder", "movies/trailers")
        fd.append("public_id", publicId)
        fd.append("resource_type", "video")
        const uploadRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/video/upload`,
          fd,
          {
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / (e.total || 1))
              setProgress((prev) => ({ ...prev, [idx]: percent }))
            },
          }
        )

        uploadedTrailers.push({
          url: uploadRes.data.secure_url,
          publicId: uploadRes.data.public_id,
        })
      } catch (err) {
        failed.push(file.name)
      }
    }

    // 3. Xác định trailer chính
    let primaryId = ""
    if (primaryTrailer) {
      if (primaryTrailer.type === "old") primaryId = primaryTrailer.id.toString()
      else primaryId = `new_${primaryTrailer.index}`
    }

    // 4. Gửi kết quả cho server
    const payload = {
      removeTrailerIds: removedIds,
      uploadedTrailers,
      primaryTrailerId: primaryId,
    }

    const res = await fetch(`/api/v1/movie/${movieId}/trailer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()

    if (!res.ok) {
      alert(json.message ?? "Lỗi upload trailer")
      setUploading(false)
      return
    }

    await onSuccess?.()
    onClose()
    setUploading(false)
  }
 

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Trailer</DialogTitle>
        </DialogHeader>

        {/* OLD TRAILERS */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Video size={18} /> Trailer cũ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {oldTrailers.map((t) =>
              removedIds.includes(t.id) ? null : (
                <div key={t.id} className="relative border rounded p-2">
                  <video src={t.url} controls className="w-full rounded" />

                  <Button
                    variant={
                      primaryTrailer?.type === "old" &&
                        primaryTrailer.id === t.id
                        ? "default"
                        : "secondary"
                    }
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setPrimaryTrailer({ type: "old", id: t.id })}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {primaryTrailer?.type === "old" &&
                      primaryTrailer.id === t.id
                      ? "Trailer chính"
                      : "Đặt làm trailer chính"}
                  </Button>

                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={() => removeOld(t.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* NEW TRAILERS */}
        <div className="mt-6 space-y-3">
          <h3 className="font-medium">Trailer mới</h3>

          <input type="file" accept="video/*" multiple onChange={handleSelectFiles} />

          <div className="grid grid-cols-2 gap-4 mt-3">
            {preview.map((p, idx) => (
              <div key={idx} className="relative border rounded p-2">
                <video src={p.url} controls className="w-full rounded" />

                <p className="text-sm text-gray-600 mt-1 truncate">{p.file.name}</p>

                {progress[idx] !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progress[idx]}%` }}
                    />
                  </div>
                )}

                <Button
                  variant={
                    primaryTrailer?.type === "new" &&
                      primaryTrailer.index === idx
                      ? "default"
                      : "secondary"
                  }
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setPrimaryTrailer({ type: "new", index: idx })}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {primaryTrailer?.type === "new" &&
                    primaryTrailer.index === idx
                    ? "Trailer chính"
                    : "Đặt làm trailer chính"}
                </Button>

                <button
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  onClick={() => removeNew(idx)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
