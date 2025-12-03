import { apiClient } from "./client"
import type { ApiResponse, CreateRoomInput, Format, Room, UpdateRoomInput } from "~/lib/api/types"
export const getRoomsByCinemaId = async (cinemaId: number): Promise<Room[]> => {
  const res = await apiClient.get<ApiResponse<Room>>(`/cinema/${cinemaId}/rooms`);

  // Trường hợp backend trả về "data": []
  if (Array.isArray(res.data)) {
    return res.data;
  }

  // Trường hợp "data": { rows: [] }
  if (res.data && Array.isArray((res.data as any).rows)) {
    return (res.data as any).rows;
  }

  // Trường hợp fallback: res.data.rows
  if (Array.isArray(res.data.rows)) {
    return res.data.rows;
  }

  return [];
};
export const getFormats = async (): Promise<Format[]> => {
  const res = await apiClient.get<ApiResponse<Format>>(`/formats`);

  // Nếu backend trả về { data: Format[] }
  if (Array.isArray(res.data)) {
    return res.data;
  }

  return [];
};
export const createRoom = async (data: CreateRoomInput): Promise<Room> => {
  try {
    const res = await apiClient.post<ApiResponse<Room>>("/room", data);

    // Nếu backend trả về data.rows
    if (res.data && typeof res.data === "object" && "rows" in res.data && Array.isArray(res.data.rows)) {
      if (res.data.rows.length > 0) return res.data.rows[0];
      throw new Error("Backend trả về mảng rỗng");
    }

    // Nếu backend trả trực tiếp Room
    if (res.data && !Array.isArray(res.data)) {
      return res.data as unknown as Room; // ép sang unknown trước khi sang Room
    }

    throw new Error("Dữ liệu trả về không hợp lệ");
  } catch (error: any) {
    console.error("Lỗi tạo phòng:", error);
    throw new Error(error.response?.data?.message || "Không thể tạo phòng");
  }
};
export const updateRoom = async (roomId: number, data: UpdateRoomInput): Promise<Room> => {
  try {
    const res = await apiClient.put<ApiResponse<Room>>(`/room/${roomId}`, data);

    // Trường hợp backend trả về { rows: Room[] }
    if (res.data && typeof res.data === "object" && "rows" in res.data && Array.isArray(res.data.rows)) {
      if (res.data.rows.length > 0) return res.data.rows[0];
      throw new Error("Backend trả về mảng rỗng");
    }

    // Trường hợp backend trả trực tiếp Room
    if (res.data && !Array.isArray(res.data)) {
      return res.data as unknown as Room; // ép sang unknown trước khi sang Room
    }

    throw new Error("Dữ liệu trả về không hợp lệ");
  } catch (error: any) {
    console.error("Lỗi cập nhật phòng:", error);
    throw new Error(error.response?.data?.message || "Không thể cập nhật phòng");
  }
};

export const deleteRooms = async (roomIds: number[]): Promise<void> => {
  try {
    await apiClient.delete(`/rooms`, {
      data: { IDs: roomIds }, // chú ý body khi dùng DELETE
    });
  } catch (error: any) {
    console.error("Xóa phòng thất bại:", error);
    throw new Error(error.response?.data?.message || "Lỗi khi xóa phòng");
  }
};