import { apiClient } from "./client"
import type { Actor, ApiResponse, CreateActors, CreateDirectorInput, Director, PaginatedApiResponse, UpdateDirectorInput } from "./types";

export const getActor = async (params?: { page?: number; limit?: number; search?: string }) => {
  const res = await apiClient.get<PaginatedApiResponse<Actor>>(`/actor`, params);
  return res.data; // res.data có { rows, totalCount, page, limit }
};

export const createActor = async (formData: FormData) => {
  return apiClient.postForm("/actor/", formData)
}

export const createActors = async (names: string[]): Promise<Actor[]> => {
  if (names.length === 0) {
    throw new Error("Không có tên để tạo");
  }

  try {
    const res = await apiClient.post<Actor[]>("/actor/create-bulk", { names });
    return res; // ← Quan trọng: trả res.data thay vì toàn bộ response
  } catch (error: any) {
    // Log đầy đủ để debug
    console.error("[createActors] Lỗi API:", error);
    console.log("[createActors] Response data:", error.response?.data);
    console.log("[createActors] Status:", error.response?.status);

    // Throw lại với message thân thiện hơn nếu cần
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error; // giữ nguyên nếu không có info cụ thể
  }
};
export const updateActor = async (id: number, formData: FormData) => {
  return apiClient.putForm(`/actor/${id}`, formData)
}
export const deleteActors = async (ids: number[]): Promise<void> => {
  try {
    // Giả sử backend hỗ trợ xóa nhiều bằng cách gửi array ids trong body
    // Nếu không, có thể loop qua từng id và delete riêng
    await apiClient.delete("/actor/", { data: { ids } });
  } catch (error) {
    throw new Error("Lỗi khi xóa đạo diễn");
  }
};