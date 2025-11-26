import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner"; // ← dùng Sonner trực tiếp
import { createRoom, updateRoom } from "~/lib/api/roomApi";
import type { Room } from "~/lib/api/types";

const formSchema = z.object({
  cinemaId: z.number().int().positive(),
  roomNumber: z.number().int().min(1).max(50),
  rows: z.number().int().min(8).max(11),
  columns: z.number().int().min(11).max(14),
  formatIds: z.array(z.number()).min(1, "Chọn ít nhất 1 định dạng"),
  vipStartCol: z.number().int().min(1).optional(),
  vipEndCol: z.number().int().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RoomDialogProps {
  room?: Room | null;
  cinemas: { id: number; name: string }[];
  formats: { id: number; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  forcedCinemaId?: number;
}

export function RoomDialog({
  room,
  cinemas,
  formats,
  open,
  onOpenChange,
  onSuccess,
}: RoomDialogProps) {
  const isEdit = !!room;
  const [hasBookedSeats, setHasBookedSeats] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cinemaId: room?.cinemaId || undefined,
      roomNumber: room?.roomNumber || 1,
      rows: 8,
      columns: 14,
      formatIds: room?.formats.map((f) => f.id) || [],
      vipStartCol: 3,
      vipEndCol: 12,
    },
  });

  const rows = useWatch({ control: form.control, name: "rows" });
  const columns = useWatch({ control: form.control, name: "columns" });
  const vipStart = useWatch({ control: form.control, name: "vipStartCol" }) || 3;
  const vipEnd = useWatch({ control: form.control, name: "vipEndCol" }) || 12;

  const rowLabels = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
  const lastRow = rowLabels[rowLabels.length - 1];
  const lastVipRow = lastRow === "K" ? "I" : "H";
  const lastRowCols = columns % 2 === 0 ? columns - 2 : columns - 1;

  useEffect(() => {
    if (room?.seats) {
      setHasBookedSeats(room.seats.some((s) => !s.isAvailable));
    }
  }, [room]);

  useEffect(() => {
    if (isEdit && room && open) {
      const rowCount = room.row?.length || 8;
      const maxCol = room.seats?.length ? Math.max(...room.seats.map((s) => s.column)) : 14;
      form.reset({
        cinemaId: room.cinemaId,
        roomNumber: room.roomNumber,
        rows: rowCount >= 8 && rowCount <= 11 ? rowCount : 8,
        columns: maxCol,
        formatIds: room.formats.map((f) => f.id),
        vipStartCol: 3,
        vipEndCol: 12,
      });
    }
  }, [isEdit, room, open, form]);

 const onSubmit = async (data: FormValues) => {
  try {
    const payload: any = {
      cinemaId: data.cinemaId,
      roomNumber: data.roomNumber,
      row: rowLabels.join(""),
      columns: data.columns,
      formatIds: data.formatIds,
    };

    if (!isEdit || !hasBookedSeats) {
      payload.vipColMin = data.vipStartCol;
      payload.vipColMax = data.vipEndCol;
    }

    if (isEdit) {
      await updateRoom(room!.id, payload);
      toast.success("Cập nhật phòng thành công");
    } else {
      await createRoom(payload);
      toast.success("Tạo phòng chiếu thành công");
    }

    onOpenChange(false);
    onSuccess?.();
  } catch (err: any) {
    toast.error(err.message || "Có lỗi xảy ra");
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa phòng chiếu" : "Tạo phòng chiếu mới"}</DialogTitle>
        </DialogHeader>

        {isEdit && hasBookedSeats && (
          <Alert className="border-orange-500">
            <AlertDescription>
              Phòng đã có ghế được đặt → Không thể thay đổi layout ghế
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cột trái */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                {/* Cinema */}
                <FormField
                  control={form.control}
                  name="cinemaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rạp chiếu</FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded-md px-3 py-2"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Chọn rạp</option>
                          {cinemas.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Room number */}
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số phòng</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rows & Columns */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="rows"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Số hàng ghế</FormLabel>
                          <span className="text-sm font-medium">{field.value} hàng</span>
                        </div>
                        <FormControl>
                          <Slider min={8} max={11} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="columns"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Số cột ghế</FormLabel>
                          <span className="text-sm font-medium">{field.value} cột</span>
                        </div>
                        <FormControl>
                          <Slider min={11} max={14} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Formats */}
                <FormField
                  control={form.control}
                  name="formatIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Định dạng chiếu</FormLabel>
                      <div className="space-y-2">
                        {formats.map((fmt) => {
                          const checked = form.watch("formatIds")?.includes(fmt.id);
                          return (
                            <div key={fmt.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => {
                                  const curr = form.getValues("formatIds") || [];
                                  if (c) form.setValue("formatIds", [...curr, fmt.id]);
                                  else form.setValue("formatIds", curr.filter((id) => id !== fmt.id));
                                }}
                              />
                              <label className="text-sm">{fmt.name}</label>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cột phải: Preview + VIP */}
              <div className="space-y-4">
                {/* Preview ghế */}
                <div className="text-center">
                  <h4 className="font-medium mb-3">Preview ghế</h4>
                  <div className="bg-gray-900 rounded-t-xl p-3 text-white text-center text-sm font-medium">MÀN HÌNH</div>
                  <div className="bg-muted/50 border-2 border-dashed rounded-b-xl p-4 min-h-96">
                    <div className="grid grid-cols-12 gap-1 max-w-lg mx-auto">
                      {rowLabels.map((row) => {
                        const isLastRow = row === lastRow;
                        const colCount = isLastRow ? lastRowCols : columns;
                        return (
                          <div key={row} className="contents">
                            <div className="text-xs font-medium text-muted-foreground flex items-center">{row}</div>
                            {Array.from({ length: columns }, (_, i) => i + 1).map((col) => {
                              if (isLastRow && col > colCount) return null;
                              const isVipRow = row >= "D" && row <= lastVipRow;
                              const isVipCol = col >= vipStart && col <= vipEnd;
                              const isVip = isVipRow && isVipCol;
                              const isCouple = isLastRow;
                              return (
                                <div key={`${row}${col}`} className={`aspect-square rounded flex items-center justify-center text-xs font-medium
                                  ${isCouple ? "bg-pink-500 text-white" : ""}
                                  ${isVip ? "bg-amber-500 text-white" : ""}
                                  ${!isCouple && !isVip ? "bg-gray-300" : ""}
                                  ${col > colCount ? "opacity-0" : ""}`}>
                                  {col}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center gap-6 mt-6 text-sm">
                      <div className="flex items-center gap-2"><div className="w-5 h-5 bg-gray-300 rounded" />Thường</div>
                      <div className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-500 rounded" />VIP</div>
                      <div className="flex items-center gap-2"><div className="w-5 h-5 bg-pink-500 rounded" />Couple</div>
                    </div>
                  </div>
                </div>

                {/* VIP range */}
                {(!isEdit || !hasBookedSeats) && (
                  <div className="bg-muted/40 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Vùng ghế VIP</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Từ cột</span>
                          <Badge variant="secondary">{vipStart}</Badge>
                        </div>
                        <Slider min={1} max={columns - 1} value={[vipStart]} onValueChange={(v) => form.setValue("vipStartCol", v[0])} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Đến cột</span>
                          <Badge variant="secondary">{vipEnd}</Badge>
                        </div>
                        <Slider min={vipStart + 1} max={columns} value={[vipEnd]} onValueChange={(v) => form.setValue("vipEndCol", v[0])} />
                      </div>
                      <p className="text-xs text-muted-foreground">VIP áp dụng từ hàng D → {lastVipRow}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit">{isEdit ? "Cập nhật" : "Tạo phòng"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
