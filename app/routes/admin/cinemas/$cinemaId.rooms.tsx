import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Edit, Trash2, ArrowLeft, Theater, MapPin, Phone } from "lucide-react";

import { getCinemaById } from "~/lib/api/cinemaApi";
import { getRoomsByCinemaId, deleteRoom } from "~/lib/api/roomApi";
import type { Cinema, Room, Format } from "~/lib/api/types";

export default function CinemaRoomsPage() {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();

  // Sửa đúng: Cinema là object, không phải mảng
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!cinemaId) return;

      try {
        // Lấy thông tin rạp (có thể có nhiều địa chỉ → lấy cái đầu tiên hoặc chính)
        const cinemaData = await getCinemaById(Number(cinemaId));
        setCinema(cinemaData);

        // Lấy danh sách phòng
        const roomsData = await getRoomsByCinemaId(Number(cinemaId));
        setRooms(roomsData);
      } catch (err: any) {
        console.error("Lỗi tải dữ liệu:", err);
        alert(err?.response?.data?.message || "Không thể tải thông tin rạp");
        navigate("/admin/cinemas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cinemaId, navigate]);

  const handleDelete = async (roomId: number) => {
    if (!confirm("Xóa phòng chiếu này?\nTất cả ghế và lịch chiếu liên quan sẽ bị xóa!")) return;

    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        <p className="text-gray-600">Đang tải thông tin rạp và phòng chiếu...</p>
      </div>
    );
  }

  // Không tìm thấy rạp
  if (!cinema) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-600">Không tìm thấy rạp chiếu phim</p>
        <button onClick={() => navigate("/admin/cinemas")} className="mt-4 text-blue-600 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Lấy địa chỉ chính (nếu có nhiều thì lấy cái đầu)
  const mainAddress = cinema.address?.[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/cinemas")}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Quay lại danh sách rạp
      </button>

      {/* Header rạp */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <Theater className="w-10 h-10 text-blue-600" />
              {cinema.name}
            </h1>

            {mainAddress && (
              <div className="mt-3 space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {mainAddress.fullAddress || `${mainAddress.house_number} ${mainAddress.street}, ${mainAddress.ward}, ${mainAddress.district}, ${mainAddress.province}`}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {cinema.phone}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${cinema.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {cinema.isActive ? "Đang hoạt động" : "Tạm đóng"}
              </span>
              <span className="text-sm text-gray-500">
                {rooms.length} phòng chiếu
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("new")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-5 h-5" />
            Thêm phòng chiếu
          </button>
        </div>
      </div>

      {/* Danh sách phòng */}
      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Theater className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-4">Chưa có phòng chiếu nào</p>
          <button onClick={() => navigate("new")} className="text-blue-600 font-medium hover:underline">
            Tạo phòng chiếu đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Phòng</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Số ghế</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Hàng ghế</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Định dạng</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Tạo ngày</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => navigate(`${room.id}`)}
                >
                  <td className="px-6 py-4 font-medium">
                    {room.name}
                    <span className="text-gray-500 text-sm ml-2">(P.{room.number})</span>
                  </td>
                  <td className="px-6 py-4">{room.capacity} ghế</td>
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {room.row}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {room.format.map((f: Format) => (
                        <span
                          key={f.id}
                          className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium"
                        >
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        room.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : room.status === "INACTIVE"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {room.status === "ACTIVE" ? "Hoạt động" : room.status === "INACTIVE" ? "Tạm dừng" : "Bảo trì"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(room.createdAt), "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`${room.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}