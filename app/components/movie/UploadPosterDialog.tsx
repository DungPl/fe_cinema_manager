import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

type Poster = {
  id: number
  url: string
  isPrimary: boolean
}

type PrimaryPoster =
  | { type: "old"; id: number }
  | { type: "new"; index: number }
  | null

type Props = {
  open: boolean
  onClose: () => void
  movieId: number
  oldPosters: Poster[]
  onSuccess?: () => void
}

export default function UploadPosterDialog({ open, onClose, movieId, oldPosters, onSuccess }: Props) {
  const [serverPosters, setServerPosters] = useState<Poster[]>(oldPosters)
  const [newPosters, setNewPosters] = useState<File[]>([])

  const initialPrimary = oldPosters.find(p => p.isPrimary)
  const [primaryPoster, setPrimaryPoster] = useState<PrimaryPoster>(
    initialPrimary ? { type: "old", id: initialPrimary.id } : null
  )

  const formDataRef = useRef<FormData>(new FormData())

  // Add new posters
  const handleAddPoster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const updated = [...newPosters, ...files]
    setNewPosters(updated)

    formDataRef.current.delete("posters")
    updated.forEach(f => formDataRef.current.append("posters", f))
  }

  // Remove poster from server
  const removeOldPoster = (posterId: number) => {
    setServerPosters(prev => prev.filter(p => p.id !== posterId))
    formDataRef.current.append("removePosterIds", posterId.toString())

    if (primaryPoster?.type === "old" && primaryPoster.id === posterId) {
      setPrimaryPoster(null)
    }
  }

  // SAVE
  
  const handleSave = async () => {
    const fd = formDataRef.current
    fd.set("movieId", movieId.toString())

    // BACKEND CHỈ DÙNG isPrimary
    // ---------------------------------
    // Nếu chọn poster mới làm poster chính → gửi isPrimary=true
    // Nếu chọn poster cũ → gửi isPrimary=false (backend giữ nguyên poster chính)
    // ---------------------------------
    
    if (primaryPoster) {
      if (primaryPoster.type === "old") {
        fd.set("primaryPosterId", primaryPoster.id.toString())
      } else if (primaryPoster.type === "new") {
        fd.set("primaryPosterId", `new_first`)
      }
    }

    const res = await fetch(`/api/v1/movie/${movieId}/poster`, {
      method: "POST",
      body: fd,
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.message ?? "Lưu poster thất bại")
      return
    }

    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quản lý Poster</DialogTitle>
        </DialogHeader>

        {/* OLD POSTERS */}
        <div className="mt-4">
          <h3 className="font-medium">Poster hiện có</h3>

          <div className="grid grid-cols-3 gap-4 mt-3">
            {serverPosters.map(p => (
              <div key={p.id} className="relative group border rounded p-1">
                <img src={p.url} className="w-full h-40 rounded object-cover" />

                {/* remove */}
                <button
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removeOldPoster(p.id)}
                >
                  X
                </button>

                {/* set primary */}
                <button
                  className={`mt-2 w-full text-xs py-1 rounded ${
                    primaryPoster?.type === "old" && primaryPoster.id === p.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setPrimaryPoster({ type: "old", id: p.id })}
                >
                  {primaryPoster?.type === "old" && primaryPoster.id === p.id
                    ? "Poster chính"
                    : "Đặt làm poster chính"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEW POSTERS */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">Thêm poster mới</h3>

          <Input type="file" accept="image/*" multiple onChange={handleAddPoster} />

          <div className="grid grid-cols-3 gap-4 mt-3">
            {newPosters.map((file, idx) => (
              <div key={idx} className="relative group border rounded p-1">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-40 object-cover rounded"
                />

                {/* remove */}
               <button
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                  onClick={() => {
                    const updated = newPosters.filter((_, i) => i !== idx)
                    setNewPosters(updated)

                    formDataRef.current.delete("posters")
                    updated.forEach(f => formDataRef.current.append("posters", f))

                    if (primaryPoster?.type === "new" && primaryPoster.index === idx) {
                      setPrimaryPoster(null)
                    } else if (primaryPoster?.type === "new" && primaryPoster.index > idx) {
                      // Sửa index nếu remove trước nó
                      setPrimaryPoster({ type: "new", index: primaryPoster.index - 1 })
                    }
                  }}
                >
                  X
                </button>

                {/* set primary */}
                <button
                  className={`mt-2 w-full text-xs py-1 rounded ${
                    primaryPoster?.type === "new" && primaryPoster.index === idx
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setPrimaryPoster({ type: "new", index: idx })}
                >
                  {primaryPoster?.type === "new" && primaryPoster.index === idx
                    ? "Poster chính"
                    : "Đặt làm poster chính"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu lại</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
