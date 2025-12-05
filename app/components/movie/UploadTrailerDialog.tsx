// ~/components/movie/UploadTrailerDialog.tsx

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { X, Star, Video } from "lucide-react"

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

  const formDataRef = useRef<FormData>(new FormData())

  /** --------------------------------------
   *  CHỌN FILE VIDEO
   * --------------------------------------*/
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPrev = [...preview]
    const fd = formDataRef.current

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      newPrev.push({ url: URL.createObjectURL(f), file: f })
      fd.append("trailers", f)
    }

    setPreview(newPrev)
  }

  /** --------------------------------------
   *  XÓA TRAILER CŨ / MỚI
   * --------------------------------------*/
  const removeOld = (id: number) => {
    setRemovedIds((prev) => [...prev, id])
    if (primaryTrailer?.type === "old" && primaryTrailer.id === id) {
      setPrimaryTrailer(null)
    }
  }

  const removeNew = (index: number) => {
    const fd = formDataRef.current

    const temp = Array.from(fd.getAll("trailers"))
    temp.splice(index, 1)
    fd.delete("trailers")
    temp.forEach((v) => fd.append("trailers", v as File))

    const pv = [...preview]
    pv.splice(index, 1)
    setPreview(pv)

    if (primaryTrailer?.type === "new" && primaryTrailer.index === index) {
      setPrimaryTrailer(null)
    } else if (primaryTrailer?.type === "new" && primaryTrailer.index > index) {
      // Sửa index nếu remove trước nó
      setPrimaryTrailer({ type: "new", index: primaryTrailer.index - 1 })
    }
  }

  /** --------------------------------------
   *  LƯU VIDEO
   * --------------------------------------*/
  const handleSave = async () => {
    const fd = formDataRef.current

    // Gửi danh sách ID cần xóa
    removedIds.forEach((id) => fd.append("removeTrailerIds", id.toString()))

    // Sửa: Sử dụng primaryTrailerId thay vì isPrimary
    // ---------------------------------
    // Nếu chọn trailer cũ → gửi primaryTrailerId = id (string)
    // Nếu chọn trailer mới → gửi primaryTrailerId = `new_${index}`
    // Nếu không chọn → không gửi, backend không thay đổi primary
    // ---------------------------------
    if (primaryTrailer) {
      if (primaryTrailer.type === "old") {
        fd.set("primaryTrailerId", primaryTrailer.id.toString())
      } else if (primaryTrailer.type === "new") {
        fd.set("primaryTrailerId", `new_${primaryTrailer.index}`)
      }
    }

    const res = await fetch(`/api/v1/movie/${movieId}/trailer`, {
      method: "POST",
      body: fd,
    })

    const json = await res.json()

    if (!res.ok) {
      alert(json.message ?? "Lỗi upload trailer")
      return
    }

    await onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Trailer</DialogTitle>
        </DialogHeader>

        {/* OLD TRAILERS */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Video size={18} /> Trailer cũ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {oldTrailers.map((t) => {
              if (removedIds.includes(t.id)) return null
              return (
                <div key={t.id} className="relative border rounded p-2">
                  <video src={t.url} controls className="w-full rounded" />

                  {/* Set primary */}
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

                  {/* Remove */}
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={() => removeOld(t.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* NEW TRAILERS PREVIEW */}
        <div className="mt-6 space-y-3">
          <h3 className="font-medium">Trailer mới</h3>

          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleSelectFiles}
          />

          <div className="grid grid-cols-2 gap-4 mt-3">
            {preview.map((p, idx) => (
              <div key={idx} className="relative border rounded p-2">
                <video src={p.url} controls className="w-full rounded" />

                <Button
                  variant={
                    primaryTrailer?.type === "new" &&
                    primaryTrailer.index === idx
                      ? "default"
                      : "secondary"
                  }
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    setPrimaryTrailer({ type: "new", index: idx })
                  }
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
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
 