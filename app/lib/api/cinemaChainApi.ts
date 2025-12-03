import { toBoolean } from "../utils"
import { apiClient } from "./client"

import type { ApiResponse, CinemaChain } from "./types"

export const getCinemaChains = async (): Promise<CinemaChain[]> => {
  const res = await apiClient.get<ApiResponse<CinemaChain>>("/chain/")

  // Lấy rows từ nhiều vị trí có thể
  const rows = res?.data.rows ?? []
  
  return rows.map((c: any) => ({
    ...c,
    isActive: toBoolean(c.isActive),
  }))
}
export const createCinemaChain = async (formData: FormData) => {
  return apiClient.postForm("/chain/", formData)
}

// UPDATE: Dùng FormData
export const updateCinemaChain = async (id: number, formData: FormData) => {
  return apiClient.putForm(`/chain/${id}`, formData)
}

export const deleteCinemaChains = (ids: number[]) =>
  apiClient.delete("/chain/", { ids })