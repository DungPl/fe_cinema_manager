import type { CreateShowtimeBatchInput, FilterShowtimeParams, Showtime, ShowtimeResponse } from "~/lib/api/types";
import { apiClient } from "./client";

export const getShowtimes = async (
  filters: FilterShowtimeParams
): Promise<ShowtimeResponse[]> => {
  // Loại bỏ undefined/null/""
  const params: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value;
    }
  });

  const res = await apiClient.get<{ data: ShowtimeResponse[] }>(
    "/showtime",
    params
  );

  return res.data;
};
export const createShowtimeBatch = async (
  data: CreateShowtimeBatchInput
): Promise<{ message: string }> => {

  return apiClient.post("/showtime/batch", data)
}