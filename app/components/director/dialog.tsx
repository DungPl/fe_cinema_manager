import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { toast } from "sonner"
import type { Director } from "~/lib/api/types"

interface DirectorDialogProps {
  open: boolean
  onClose: () => void
  onSave: (formData: FormData) => Promise<void>
  initialData?: Director | null
}

export function DirectorDialog({ open, onClose, onSave, initialData }: DirectorDialogProps) {
  const [name, setName] = useState("")
  const [nationality, setNationality] = useState("")
  const [biography, setBiography] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Reset form mỗi khi mở dialog
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name ?? "")
        setNationality(initialData.nationality ?? "")
        setBiography(initialData.biography ?? "")
        setPreview(initialData.avatar ?? null)
      } else {
        setName("")
        setNationality("")
        setBiography("")
        setAvatarFile(null)
        setPreview(null)
      }
    }
  }, [initialData, open])

  // Preview avatar
  useEffect(() => {
    if (!avatarFile) {
      setPreview(initialData?.avatar ?? null)
      return
    }

    const url = URL.createObjectURL(avatarFile)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [avatarFile, initialData?.avatar])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên đạo diễn")
      return
    }

    if (!nationality.trim()) {
      toast.error("Vui lòng nhập quốc tịch")
      return
    }

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("nationality", nationality.trim())

    if (biography.trim()) {
      formData.append("biography", biography.trim())
    }

    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }

    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Cập nhật đạo diễn" : "Thêm đạo diễn"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            <div className="flex items-center gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 border-2 border-dashed rounded-lg" />
              )}

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Tên đạo diễn */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên đạo diễn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Christopher Nolan..."
            />
          </div>

          {/* Quốc tịch */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Quốc tịch *</Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Anh, Mỹ, Hàn Quốc..."
            />
          </div>

          {/* Tiểu sử */}
          <div className="space-y-2">
            <Label htmlFor="biography">Tiểu sử</Label>
            <Textarea
              id="biography"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Tiểu sử đạo diễn (không bắt buộc)..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit}>
            {initialData ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
