import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface BatchActorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (names: string[]) => Promise<void>;
}

export const BatchActorDialog = ({ isOpen, onClose, onSave }: BatchActorDialogProps) => {
  const [namesInput, setNamesInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const names = namesInput
      .split(/\n|,/g)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error("Vui lòng nhập ít nhất một tên diễn viên");
      return;
    }

    setLoading(true);

    try {
      await onSave(names);  // hoặc createActors(names)

      // Chỉ thành công thật sự mới toast success và đóng dialog
      //toast.success("Thêm diễn viên thành công!");
      // setNamesInput("");           // reset input
      // onClose();                   // chỉ đóng khi OK
    } catch (error: any) {
      console.error("Lỗi thêm diễn viên:", error);

      let displayMessage = "Có lỗi xảy ra khi thêm diễn viên";

      if (error.response?.data?.error) {
        displayMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        displayMessage = error.response.data.message;
      } else if (error.message) {
        displayMessage = error.message;
      }

      // Hiển thị toast lỗi, nhưng KHÔNG đóng dialog
      toast.error(displayMessage, {
        duration: 8000,  // cho người dùng đọc kỹ danh sách trùng
        position: "top-center",
        style: {
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        },
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm hàng loạt diễn viên</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="names" className="text-right">
              Danh sách tên
            </Label>
            <Textarea
              id="names"
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder="Nhập tên diễn viên, cách nhau bằng dấu phẩy hoặc dòng mới (ví dụ: Tom Hanks, Emma Watson)"
              className="col-span-3"
              rows={5}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};