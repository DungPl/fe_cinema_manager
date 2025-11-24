// ~/components/cinema_chain/dialog.tsx
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { toast } from "sonner"
import type { CinemaChain } from "~/lib/api/types"

interface CinemaChainDialogProps {
  open: boolean
  onClose: () => void
  onSave: (formData: FormData) => Promise<void>
  initialData?: CinemaChain | null
}

export function CinemaChainDialog({ open, onClose, onSave, initialData }: CinemaChainDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [active, setActive] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Reset form khi mở/đóng
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name ?? "")
        setDescription(initialData.description ?? "")
        setActive(initialData.isActive ?? true)
        setPreview(initialData.logoUrl ?? null)
      } else {
        setName("")
        setDescription("")
        setActive(true)
        setLogoFile(null)
        setPreview(null)
      }
    }
  }, [initialData, open])

  // Tạo preview khi chọn file
  useEffect(() => {
    if (!logoFile) {
      setPreview(initialData?.logoUrl ?? null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile, initialData?.logoUrl])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chuỗi rạp")
      return
    }

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("description", description.trim())
    formData.append("active", active ? "1" : "0")
    if (logoFile) {
      formData.append("logo", logoFile)
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
          <DialogTitle>{initialData ? "Cập nhật" : "Thêm"} chuỗi rạp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="w-20 h-20 object-contain rounded-lg border" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 border-2 border-dashed rounded-lg" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Tên */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên chuỗi rạp *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CGV, Lotte Cinema..."
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về chuỗi rạp..."
              rows={3}
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Hoạt động</Label>
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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