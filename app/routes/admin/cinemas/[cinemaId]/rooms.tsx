import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

import { ArrowLeft, Plus, Trash2, Edit, Film, Users, CalendarClock, Hash, Loader2 } from "lucide-react";
import { deleteRooms, getRoomsByCinemaId } from "~/lib/api/roomApi";
import { useEffect, useState } from "react";
import type { Room } from "~/lib/api/types";

export default function CinemaRoomsPage() {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Load danh sách phòng
  const fetchRooms = async () => {
    if (!cinemaId) return;
    setLoading(true);
    try {
      const data = await getRoomsByCinemaId(Number(cinemaId));
      setRooms(data);
      // Reset chọn phòng khi reload
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Không tải được danh sách phòng");
      if (err?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [cinemaId]);

  // Xóa một phòng
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

  // Xóa nhiều phòng
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

  // Chọn tất cả phòng
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(rooms.map((r) => r.id));
      setSelectAll(true);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Đang tải danh sách phòng...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/cinemas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Quản lý phòng chiếu</h1>
            <p className="text-muted-foreground">
              Rạp ID: <span className="font-mono font-bold text-primary">{cinemaId}</span>
            </p>
          </div>
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

          <Link to="add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm phòng mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Danh sách phòng */}
      {rooms.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-muted/50 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Film className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Chưa có phòng chiếu nào</h3>
          <p className="text-muted-foreground mb-8">Hãy tạo phòng đầu tiên</p>
          <Link to="add">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Tạo phòng đầu tiên
            </Button>
          </Link>
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
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{room.row && `• ${room.row.length} hàng`}</span>
                </div>

                {room.formats?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {room.formats.map((f: any) => (
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
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link to={`${room.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Link>
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
    </div>
  );
}
