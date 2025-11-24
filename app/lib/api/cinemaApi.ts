import type { AxiosResponse } from "axios"
import { toBoolean } from "../utils"
import { apiClient } from "./client"

import type { ApiResponse, Cinema, CinemaChain, CinemaListResponse, CreateCinemaInput, FilterCinemaParams, UpdateCinemaInput } from "./types"

// export const getCinemas = async (): Promise<Cinema[]> => {
//   const res = await apiClient.get<{
//     status: string
//     data: { rows: Cinema[]; total?: number }
//   }>("/cinema/")
//   return res.data.rows || []  
// }

export const getCinemas = async (params: {
  page?: number
  limit?: number
  searchKey?: string
  chainId?: number
}): Promise<CinemaListResponse> => {
  const res = await apiClient.get<{ data: CinemaListResponse }>("/cinema", params)
  return res.data  // ← giờ TypeScript biết res có .data
}
export const getCinemaById = async (cinemaId: number): Promise<Cinema> => {
  const res = await apiClient.get<{ data: Cinema }>(`/cinema/${cinemaId}`)
  return res.data // backend trả { data: {...}, status: "success" }
}
export const getCinemaChains = async (): Promise<CinemaChain[]> => {
  const res = await apiClient.get<{
    status: string
    data: { rows: CinemaChain[]; total?: number }
  }>("/chain/")
  return res.data.rows || []
}

export const createCinema = async (data: CreateCinemaInput) => {
  return apiClient.post("/cinema/", data)
}

export const updateCinema = async (id: number, data: UpdateCinemaInput) => {
  return apiClient.put(`/cinema/${id}`, data)
}
export const deleteCinemas = (ids: number[]) => apiClient.delete("/cinema/", { ids })