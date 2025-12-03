import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Actor } from "~/lib/api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface ActorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: FormData) => Promise<void>;
  initialData?: Actor| null;
}

export const ActorDialog = ({ isOpen, onClose, onSave, initialData }: ActorDialogProps) => {
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [biography, setBiography] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setNationality(initialData.nationality || "");
      setBiography(initialData.biography || "");
      setAvatar(null);
      setAvatarPreview(initialData.avatar);
    } else {
      setName("");
      setNationality("");
      setBiography("");
      setAvatar(null);
      setAvatarPreview(undefined);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Tên diễn viên không được để trống");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("nationality", nationality);
    formData.append("biography", biography);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      await onSave(formData);
    } catch {
      // Page handles error toast and doesn't close
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Sửa diễn viên" : "Thêm diễn viên"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nationality" className="text-right">
              Quốc tịch
            </Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="biography" className="text-right">
              Tiểu sử
            </Label>
            <Textarea
              id="biography"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar" className="text-right">
              Avatar
            </Label>
            <Input
              id="avatar"
              type="file"
              onChange={handleFileChange}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          {avatarPreview && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-1" />
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="col-span-3 w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {initialData ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};