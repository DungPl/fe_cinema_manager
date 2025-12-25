import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

import { ArrowLeft, Plus, Trash2, Edit, Film, Users, CalendarClock, Hash, Loader2, MapPin, Building2, Phone } from "lucide-react";
import { deleteRooms, getRoomsByCinemaId, getFormats } from "~/lib/api/roomApi";
import { getCinemaById, updateCinema } from "~/lib/api/cinemaApi";
import { useEffect, useState } from "react";
import type { Room, Format, Cinema, UpdateCinemaInput } from "~/lib/api/types";
import { RoomDialog } from "~/components/rooms/dialog";
import { CinemaDialog } from "~/components/cinema/dialog";
import { useAuthStore } from "~/stores/authAccountStore"; // ← IMPORT STORE ĐỂ LẤY ROLE

export default function CinemaRoomsPage() {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const { account } = useAuthStore(); // ← LẤY ACCOUNT ĐỂ KIỂM TRA ROLE
  const isManager = account?.role === "MANAGER"; // ← Kiểm tra Manager

  const [cinema, setCinema] = useState<Cinema>();
  const [cinemaLoading, setCinemaLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [cinemaDialogOpen, setCinemaDialogOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);

  const fetchCinema = async () => {
    if (!cinemaId) return;
    setCinemaLoading(true);
    try {
      const data = await getCinemaById(Number(cinemaId));
      setCinema(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Không tải được thông tin rạp");
    } finally {
      setCinemaLoading(false);
    }
  };

  const fetchRooms = async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const [roomData, formatData] = await Promise.all([
        getRoomsByCinemaId(Number(cinemaId)),
        getFormats({ search: "", limit: 100 })
      ]);
      setRooms(roomData);
      setFormats(formatData);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Không tải được dữ liệu");
      if (err?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinema();
    fetchRooms();
  }, [cinemaId]);

  const handleDelete = async (room: Room) => {
    if (!confirm(`Xóa phòng ${room.name}?`)) return;
    try {
      await deleteRooms([room.id]);
      toast.success("Xóa thành công!");
      fetchRooms();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Xóa ${selectedIds.length} phòng chiếu?`)) return;
    try {
      await deleteRooms(selectedIds);
      toast.success("Xóa thành công!");
      fetchRooms();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(rooms.map((r) => r.id));
      setSelectAll(true);
    }
  };

  const openEditCinemaDialog = () => {
    if (!cinema) return;
    setEditingCinema(cinema);
    setCinemaDialogOpen(true);
  };

  if (loading || cinemaLoading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold">Không tìm thấy rạp chiếu</h2>
        <Button className="mt-4" onClick={() => navigate("/admin/cinemas")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header - Thông tin rạp */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* ẨN button "Quay lại" nếu là Manager */}
            {!isManager && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cinemas")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">{cinema.name}</h1>
              <p className="text-muted-foreground">
               <span className="font-mono"></span> • {cinema.roomCount || 0} phòng chiếu
              </p>
            </div>
          </div>

          <Button onClick={openEditCinemaDialog}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa rạp
          </Button>
        </div>

        {/* Thông tin rạp */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Hãng rạp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{cinema.chain?.name || "Độc lập"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Số điện thoại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{cinema.phone || "—"}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Địa chỉ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {cinema.address?.[0]?.fullAddress ||
                  [cinema.address?.[0]?.house_number, cinema.address?.[0]?.street, cinema.address?.[0]?.ward, cinema.address?.[0]?.district, cinema.address?.[0]?.province]
                    .filter(Boolean)
                    .join(", ") || "Chưa có địa chỉ"}
              </p>
            </CardContent>
          </Card>

          {cinema.description && (
            <Card className="md:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{cinema.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Phần quản lý phòng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Danh sách phòng chiếu</h2>
          <p className="text-muted-foreground">Quản lý các phòng chiếu của rạp {cinema.name}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa {selectedIds.length} phòng
          </Button>

          <Button onClick={() => { setEditingRoom(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm phòng mới
          </Button>
        </div>
      </div>

      {/* Phần còn lại giữ nguyên như code cũ của bạn */}
      {rooms.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-muted/50 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Chưa có phòng chiếu nào</h3>
          <p className="text-muted-foreground mb-8">Hãy tạo phòng đầu tiên</p>
          <Button size="lg" onClick={() => { setEditingRoom(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-5 w-5" />
            Tạo phòng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 flex justify-between items-start">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(room.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds([...selectedIds, room.id]);
                    else setSelectedIds(selectedIds.filter((id) => id !== room.id));
                  }}
                />
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <Badge
                  variant={room.status === "available" ? "default" : "secondary"}
                  className={
                    room.status === "available"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }
                >
                  {room.status === "available" ? "Hoạt động" : "Tạm dừng"}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Phòng số {room.roomNumber || "?"}</span>
                  <span>Phòng loại {room.type || "?"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{room.row && `• ${room.row.length} hàng`}</span>
                </div>

                {room.formats?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {room.formats.map((f) => (
                        <Badge key={f.id} variant="outline" className="text-xs">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {format(new Date(room.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setEditingRoom(room); setDialogOpen(true); }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(room)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog phòng */}
      <RoomDialog
        room={editingRoom}
        cinemas={[]}
        formats={formats}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchRooms}
        forcedCinemaId={Number(cinemaId)}
      />

      {/* Dialog chỉnh sửa rạp */}
      <CinemaDialog
        open={cinemaDialogOpen}
        onClose={() => {
          setCinemaDialogOpen(false);
          setEditingCinema(null);
        }}
        onSubmit={async (data) => {
          try {
            await updateCinema(cinema!.id, data as UpdateCinemaInput);
            toast.success("Cập nhật rạp thành công!");
            fetchCinema(); // Reload thông tin rạp
            setCinemaDialogOpen(false);
          } catch (err: any) {
            toast.error(err.message || "Cập nhật thất bại");
          }
        }}
        initialData={editingCinema ?? undefined}
        chains={[]} // Truyền chains nếu cần
      />
    </div>
  );
}