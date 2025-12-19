// ~/components/room/RoomDialog.tsx
import { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
import { createRoom, updateRoom } from "~/lib/api/roomApi";
import type { Room } from "~/lib/api/types";
import React from "react";

const roomLimits = {
  Small: { minRows: 5, maxRows: 8, minColumns: 10, maxColumns: 14 },
  Medium: { minRows: 9, maxRows: 12, minColumns: 11, maxColumns: 16 },
  Large: { minRows: 13, maxRows: 20, minColumns: 12, maxColumns: 20 },
  IMAX: { minRows: 15, maxRows: 25, minColumns: 14, maxColumns: 24 },
  "4DX": { minRows: 8, maxRows: 15, minColumns: 10, maxColumns: 18 },
} as const;

type RoomType = keyof typeof roomLimits;

const formSchema = z.object({
  cinemaId: z.number().int().positive(),
  roomNumber: z.number().int().min(1).max(10).optional(), // Optional khi create, required khi edit
  type: z.enum(["Small", "Medium", "Large", "IMAX", "4DX"]),
  rows: z.number().int(),
  columns: z.number().int(),
  formatIds: z.array(z.number()).min(1, "Chọn ít nhất 1 định dạng"),
  vipStartCol: z.number().int().min(1).optional(),
  vipEndCol: z.number().int().optional(),
  hasCoupleSeat: z.boolean(),
})
  .refine((data) => {
    const limit = roomLimits[data.type];
    return data.rows >= limit.minRows && data.rows <= limit.maxRows;
  }, { message: "Số hàng không hợp lệ cho loại phòng", path: ["rows"] })
  .refine((data) => {
    const limit = roomLimits[data.type];
    return data.columns >= limit.minColumns && data.columns <= limit.maxColumns;
  }, { message: "Số cột không hợp lệ cho loại phòng", path: ["columns"] });

type FormValues = z.infer<typeof formSchema>;

interface RoomDialogProps {
  room?: Room | null;
  cinemas: { id: number; name: string }[];
  formats: { id: number; name: string }[];
  open: boolean;
  forcedCinemaId: number;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;

}

export function RoomDialog({
  room,
  cinemas,
  formats,
  open,
  forcedCinemaId,
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
      type: (room?.type as RoomType) || "Medium",
      rows: 9,
      columns: 16,
      formatIds: room?.formats?.map((f) => f.id) || [],
      vipStartCol: 3,
      vipEndCol: 12,
      hasCoupleSeat: false,
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const rows = useWatch({ control: form.control, name: "rows" });
  const columns = useWatch({ control: form.control, name: "columns" });
  const vipStart = useWatch({ control: form.control, name: "vipStartCol" }) || 3;
  const vipEnd = useWatch({ control: form.control, name: "vipEndCol" }) || 12;
  const hasCoupleSeat = useWatch({ control: form.control, name: "hasCoupleSeat" });

  const limit = roomLimits[type];

  // DÙNG ĐÚNG room.row từ DB khi edit và có booked seats, fallback khi create mới hoặc edit mà không có booked seats
  const rowLabels = (isEdit && hasBookedSeats && room?.row)
    ? room.row.split("")
    : Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));

  const lastRow = rowLabels[rowLabels.length - 1] || "I";
  const lastVipRow = rowLabels.includes("K") ? "I" : "H";
  const lastRowCols = columns % 2 === 0 ? columns - 2 : columns - 1;

  // Kiểm tra có ghế nào đã bị đặt không
  useEffect(() => {
    if (room?.seats) {
      setHasBookedSeats(room.seats.some((s) => !s.isAvailable));
    }
  }, [room]);

  // Khi mở dialog edit → load đúng dữ liệu từ room
  useEffect(() => {
    if (isEdit && room && open) {
      const rowCount = room.row?.length || 9;
      const maxCol = room.seats?.length
        ? Math.max(...room.seats.map((s) => s.column))
        : 16;

      let vipStartCol = 3;
      let vipEndCol = 12;
      if (room?.seats) {
        const vipSeats = room.seats.filter((s) => s.SeatType?.type === "VIP");
        if (vipSeats.length > 0) {
          vipStartCol = Math.min(...vipSeats.map((s) => s.column));
          vipEndCol = Math.max(...vipSeats.map((s) => s.column));
        }
      }

      form.reset({
        cinemaId: room.cinemaId,
        roomNumber: room.roomNumber,
        type: (room.type as RoomType) || "Medium",
        rows: rowCount,
        columns: maxCol,
        formatIds: room.formats?.map((f) => f.id) || [],
        vipStartCol,
        vipEndCol,
        hasCoupleSeat: room.hasCoupleSeat || false,
      });
    }
  }, [isEdit, room, open, form]);

  // Force cinemaId khi tạo mới
  useEffect(() => {
    if (!isEdit && open) {
      form.setValue("cinemaId", forcedCinemaId);
    }
  }, [isEdit, open, forcedCinemaId, form]);

  // Tự động điều chỉnh rows/columns nếu vượt giới hạn khi đổi type
  useEffect(() => {
    const currentRows = form.getValues("rows");
    const currentCols = form.getValues("columns");

    if (currentRows < limit.minRows || currentRows > limit.maxRows) {
      form.setValue("rows", Math.max(limit.minRows, Math.min(currentRows, limit.maxRows)));
    }
    if (currentCols < limit.minColumns || currentCols > limit.maxColumns) {
      form.setValue("columns", Math.max(limit.minColumns, Math.min(currentCols, limit.maxColumns)));
    }
  }, [type, form, limit]);

  // Gợi ý tăng rows nếu toggle hasCoupleSeat true và rows <10 (để có K)
  useEffect(() => {
    if (hasCoupleSeat && rows < 11 && !isEdit) {
      toast.info("Để thêm hàng K cho ghế đôi, hãy tăng số hàng lên ít nhất 11");
    }
  }, [hasCoupleSeat, rows, isEdit]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        cinemaId: data.cinemaId,
        roomNumber: data.roomNumber,
        type: data.type,
        row: rowLabels.join(""),
        columns: data.columns,
        formatIds: data.formatIds,
      };

      // Chỉ gửi VIP range nếu được phép thay đổi layout
      if (!isEdit || !hasBookedSeats) {
        payload.vipColMin = data.vipStartCol;
        payload.vipColMax = data.vipEndCol;
      }

      // Xử lý hasCoupleSeat dựa trên mode để dùng chung code, nhưng gửi đúng format backend
      if (!isEdit) {
        // Create: flat hasCoupleSeat
        payload.hasCoupleSeat = data.hasCoupleSeat;
      } else {
        // Edit: nest trong seat
        payload.seat = {
          row: rowLabels.join(""),
          columns: data.columns,
          hasCoupleSeat: data.hasCoupleSeat,
        };
        if (!isEdit || !hasBookedSeats) {
          payload.seat.vipColMin = data.vipStartCol;
          payload.seat.vipColMax = data.vipEndCol;
        }
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa phòng chiếu" : "Tạo phòng chiếu mới"}</DialogTitle>
        </DialogHeader>

        {isEdit && hasBookedSeats && (
          <Alert className="border-orange-500">
            <AlertDescription>
              Phòng đã có khách đặt vé → Không thể thay đổi bố trí ghế
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* === CỘT TRÁI: Form nhập liệu === */}
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phòng số</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại phòng</FormLabel>
                      <FormControl>
                        <select className="w-full border rounded-md px-3 py-2" {...field} disabled={isEdit && hasBookedSeats}>
                          {Object.keys(roomLimits).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">

                  {/* SỐ HÀNG */}
                  <FormField
                    control={form.control}
                    name="rows"
                    render={({ field }) => {
                      // Tự động scale theo số rows
                      const width = 150 + field.value * 5; // tối thiểu 150px, tăng dần
                      return (
                        <FormItem>
                          <div className="flex justify-between text-sm mb-1">
                            <FormLabel>Số hàng</FormLabel>
                            <span className="font-medium">{field.value} hàng</span>
                          </div>

                          <FormControl>
                            <div style={{ width: `${width}px` }} className="transition-all">
                              <Slider
                                min={limit.minRows}
                                max={limit.maxRows}
                                step={1}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                                disabled={isEdit && hasBookedSeats}
                              />
                            </div>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* SỐ CỘT */}
                  <FormField
                    control={form.control}
                    name="columns"
                    render={({ field }) => {
                      const width = 150 + field.value * 5;
                      return (
                        <FormItem>
                          <div className="flex justify-between text-sm mb-1">
                            <FormLabel>Số cột</FormLabel>
                            <span className="font-medium">{field.value} cột</span>
                          </div>

                          <FormControl>
                            <div style={{ width: `${width}px` }} className="transition-all">
                              <Slider
                                min={limit.minColumns}
                                max={limit.maxColumns}
                                step={1}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                                disabled={isEdit && hasBookedSeats}
                              />
                            </div>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                </div>

                {/* Ghế couple */}
                <FormField
                  control={form.control}
                  name="hasCoupleSeat"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isEdit && hasBookedSeats}
                        />
                      </FormControl>
                      <FormLabel>Thêm hàng ghế đôi ở cuối</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formatIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Định dạng chiếu</FormLabel>
                      <div className="space-y-2">
                        {formats.map((fmt) => {
                          const checked = form.watch("formatIds")?.includes(fmt.id) || false;
                          return (
                            <div key={fmt.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => {
                                  const curr = form.getValues("formatIds") || [];
                                  if (c) {
                                    form.setValue("formatIds", [...curr, fmt.id]);
                                  } else {
                                    form.setValue("formatIds", curr.filter((id) => id !== fmt.id));
                                  }
                                }}
                              />
                              <label className="text-sm font-normal">{fmt.name}</label>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === CỘT PHẢI: Preview ghế + VIP slider === */}
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="font-medium mb-8 text-lg">Preview sơ đồ ghế</h4>

                  {/* TOÀN BỘ RẠP CHIẾU PHIM - ĐẸP NHƯ THẬT */}
                  <div className="mx-auto max-w-full p-4">
                    <div className="relative rounded-3xl overflow-hidden bg-linear-to-b from-black to-gray-900 shadow-2xl ring-2 ring-cyan-500/20">
                      {/* MÀN HÌNH */}
                      <div className="relative h-32 bg-linear-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center border-t-4 border-t-cyan-500 shadow-2xl">
                        <span className="text-white text-2xl font-extrabold tracking-widest drop-shadow-2xl">
                          MÀN HÌNH
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-cyan-500/30 to-transparent blur-3xl"></div>
                      </div>

                      {/* NỀN RẠP + GHẾ */}
                      <div className="relative w-full max-w-full">
                        {/* Container ghế tự động scale vừa khung màn hình */}
                        <div className="max-w-full mx-auto overflow-x-auto"> {/* Giữ overflow-x-auto cho scroll ngang nếu vẫn rộng */}
                          <div
                            className="inline-block origin-top transition-transform duration-300"
                            style={{
                              // Tính toán scale dựa trên chiều rộng container và số cột - giảm min scale xuống 0.5 để fit dialog hẹp hơn
                              transform: `scale(${Math.min(
                                1,
                                Math.max(0.5, 600 / (columns * 48)) // Đổi 800 thành 600 để scale nhỏ hơn, fit dialog
                              )})`,
                              minWidth: `${columns * 48}px`, // Giữ minWidth nhưng scale sẽ xử lý
                            }}
                          >
                            <div className="space-y-6">
                              {/* CHẾ ĐỘ EDIT */}
                              {isEdit && hasBookedSeats && room?.seats && room.seats.length > 0 ? (
                                Array.from(new Set(room.seats.map((s) => s.row)))
                                  .sort()
                                  .map((rowLabel) => {
                                    const seatsInRow = room.seats
                                      .filter((s) => s.row === rowLabel)
                                      .sort((a, b) => a.column - b.column);
                                    const isCoupleRow = rowLabel === (room.row?.slice(-1) || "I");
                                    const colCount = isCoupleRow
                                      ? seatsInRow.length
                                      : Math.max(...seatsInRow.map((s) => s.column), columns);

                                    return (
                                      <div
                                        key={rowLabel}
                                        className="flex justify-center items-center gap-6"
                                      >
                                        <span className="text-lg font-bold text-gray-300 w-8 text-right select-none">
                                          {rowLabel}
                                        </span>
                                        <div
                                          className="grid gap-3"
                                          style={{ gridTemplateColumns: `repeat(${colCount}, 44px)` }}
                                        >
                                          {seatsInRow.map((seat) => {
                                            const type = seat.SeatType?.type || "NORMAL";
                                            return (
                                              <div
                                                key={seat.id}
                                                className={`
                                    aspect-square rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-2xl transition-transform hover:scale-105
                                    ${type === "COUPLE"
                                                    ? "bg-pink-600 shadow-pink-600/60 text-2xl"
                                                    : type === "VIP"
                                                      ? "bg-amber-600 ring-4 ring-amber-400/60 shadow-amber-600/50"
                                                      : "bg-gray-700 shadow-gray-900/60"
                                                  }
                                  `}
                                              >
                                                {type === "COUPLE" ? "C" : seat.column}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })
                              ) : (
                                /* CHẾ ĐỘ TẠO MỚI */
                                rowLabels.map((row) => {
                                  const isLastRow = row === lastRow;
                                  const colCount = isLastRow && hasCoupleSeat ? lastRowCols : columns;
                                  const isVipRow = row >= "D" && row <= lastVipRow;

                                  return (
                                    <div
                                      key={row}
                                      className="flex justify-center items-center gap-6"
                                    >
                                      <span className="text-lg font-bold text-gray-300 w-8 text-right select-none">
                                        {row}
                                      </span>
                                      <div
                                        className="grid gap-3"
                                        style={{ gridTemplateColumns: `repeat(${colCount}, 44px)` }}
                                      >
                                        {Array.from({ length: colCount }, (_, i) => i + 1).map(
                                          (col) => {
                                            const isVip =
                                              isVipRow && col >= vipStart && col <= vipEnd;
                                            const isCouple = isLastRow && hasCoupleSeat;

                                            return (
                                              <div
                                                key={col}
                                                className={`
                                    aspect-square rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-2xl transition-transform hover:scale-105
                                    ${isCouple
                                                    ? "bg-pink-600 shadow-pink-600/60 text-2xl"
                                                    : isVip
                                                      ? "bg-amber-600 ring-4 ring-amber-400/60 shadow-amber-600/50"
                                                      : "bg-gray-700 shadow-gray-900/60"
                                                  }
                                  `}
                                              >
                                                {isCouple ? "C" : col}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Legend - đẹp, gọn, đúng chuẩn rạp - thêm flex-wrap để wrap nếu hẹp */}
                        <div className="flex justify-center gap-8 mt-12 pt-8 border-t border-gray-700/50 flex-wrap">
                          <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-700 shadow-xl transition-transform group-hover:scale-110" />
                            <span className="text-gray-300 font-medium">Thường</span>
                          </div>
                          <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-amber-600 ring-4 ring-amber-400/50 shadow-xl transition-transform group-hover:scale-110" />
                            <span className="text-gray-300 font-medium">VIP</span>
                          </div>
                          <div className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center text-2xl font-bold shadow-2xl shadow-pink-600/60 transition-transform group-hover:scale-110">
                              C
                            </div>
                            <span className="text-gray-300 font-medium">Couple</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIP Slider - giữ nguyên, nhưng thêm max-w-full nếu cần */}
                {(!isEdit || !hasBookedSeats) && (
                  <div className="bg-muted/40 p-5 rounded-lg space-y-4 border max-w-full">
                    <h4 className="font-medium">Vùng ghế VIP</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Từ cột</span>
                          <Badge>{vipStart}</Badge>
                        </div>
                        <Slider
                          min={1}
                          max={columns - 1}
                          value={[vipStart]}
                          onValueChange={(v) => form.setValue("vipStartCol", v[0])}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Đến cột</span>
                          <Badge>{vipEnd}</Badge>
                        </div>
                        <Slider
                          min={vipStart + 1}
                          max={columns}
                          value={[vipEnd]}
                          onValueChange={(v) => form.setValue("vipEndCol", v[0])}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Áp dụng cho các hàng từ D → {lastVipRow}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit">
                {isEdit ? "Cập nhật phòng" : "Tạo phòng mới"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}