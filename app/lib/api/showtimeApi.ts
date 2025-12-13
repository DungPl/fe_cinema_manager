import type { AutoGenerateResponse, CreateShowtimeBatchInput, FilterShowtimeParams, Showtime, ShowtimeResponse, UpdateShowtime } from "~/lib/api/types";
import { apiClient } from "./client";

export const getShowtimes = async (
  filters: FilterShowtimeParams
): Promise<ShowtimeResponse[]> => {
  // Loại bỏ undefined/null/""
  const params: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      // Chuẩn hóa key thành lowercase để match server
      const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1); // Ví dụ: Province → province, CinemaId → cinemaId
      params[normalizedKey] = value;
    }
  });

  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: ShowtimeResponse[]
  }>("/showtime", params);

  // Trả về đúng data
  return response.data;
};
export const getShowtimeByCinemaAndDate = async (
  cinemaId: number,
  date: string
): Promise<Showtime[]> => {
  const res = await apiClient.get<Showtime[]>(
    `/showtime/${cinemaId}`,
    {
      params:  cinemaId,date ,
    }
  );

  return res; // Không còn unknown
};
export const createShowtimeBatch = async (
  data: CreateShowtimeBatchInput
): Promise<AutoGenerateResponse> => {
  const res = await apiClient.post<AutoGenerateResponse>(
    "/showtime/auto-generate",
    data
  );

  return res;  // không dùng res.data nữa
};
export const updateShowtime = async (showtimeId: number, data: UpdateShowtime): Promise<{ message: string }> => {
  return apiClient.put(`/showtime/${showtimeId}`, data)
}
export const deleteShowtime = async (id: number) => {
  return apiClient.delete(`/showtime/${id}`);
};