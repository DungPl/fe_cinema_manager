import { apiClient } from "./client"

import type { ApiResponse, AdminStats, AdminStatsResponse } from "./types"
export const getAdminStats = async (): Promise<AdminStats> => {
  const res = await apiClient.get<AdminStatsResponse>("/statistic/")
  return res.data
}
export const getAdminStatsV3 = async (): Promise<AdminStats> => {
  const res = await apiClient.get<AdminStats>("/admin/stats")
  return res
}