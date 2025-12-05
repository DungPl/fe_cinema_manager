import { apiClient } from "./client"
import type { ApiResponse, CreateDirectorInput, Director, PaginatedApiResponse, UpdateDirectorInput } from "./types";

export const getDirectors = async (): Promise<Director[]> => {
  const res = await apiClient.get<PaginatedApiResponse<Director>>("/director/");
  return res.data.rows; // ✅ res.data: PaginatedApiResponse → res.data.data: PaginatedResponse → rows
};

export const createDirector = async (formData: FormData) => {
  return apiClient.postForm("/director/", formData)
}

export const updateDirector = async (id: number, formData: FormData) => {
  return apiClient.putForm(`/director/${id}`, formData)
}
export const deleteDirectors = async (ids: number[]): Promise<void> => {
  try {
    // Giả sử backend hỗ trợ xóa nhiều bằng cách gửi array ids trong body
    // Nếu không, có thể loop qua từng id và delete riêng
    await apiClient.delete("/director/", { data: { ids } });
  } catch (error) {
    throw new Error("Lỗi khi xóa đạo diễn");
  }
};