import { toBoolean } from "../utils"
import { apiClient } from "./client"

import { type ApiResponse, type CinemaChain, type PaginatedApiResponse } from "./types"

export const getCinemaChains = async (): Promise<CinemaChain[]> => {
  try {
    // Dùng đúng type wrapper
    const response = await apiClient.get<PaginatedApiResponse<CinemaChain>>("/chain/")

    // res.data chính là { status, data: { rows } }
    const rows = response.data.rows ?? []

    return rows.map(c => ({
      ...c,
      isActive: toBoolean(c.isActive),
    }))
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Không thể tải dữ liệu chuỗi rạp")
  }
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