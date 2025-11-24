import { apiClient } from "./client"
import type { Room } from "~/lib/api/types"

export const getRoomsByCinemaId = async (cinemaId: number): Promise<Room[]> => {
  const res = await apiClient.get<{ data: Room[] }>(`/cinema/${cinemaId}/rooms`)
  return res.data // backend trả { data: [...], status: "success" }
}
export const deleteRoom = async (roomId: number): Promise<void> => {
  try {
    await apiClient.delete(`/rooms/${roomId}`);
    // Backend thường trả { status: "success" } hoặc object rỗng, nên không cần return
  } catch (error: any) {
    console.error("Xóa phòng thất bại:", error);
    throw new Error(error.response?.data?.message || "Lỗi khi xóa phòng");
  }
};