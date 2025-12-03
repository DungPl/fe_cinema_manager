// ~/lib/api/movieApi.ts
import { apiClient } from "./client"
import type { ApiResponse, Movie, PaginatedMovieResponse, UploadResult } from "./types"

// Lấy danh sách movie (có phân trang & search)
export const getMovies = (params?: { page?: number; limit?: number; search?: string }) => {
  return apiClient.get<PaginatedMovieResponse>("/movie", params)
}
// Lấy chi tiết 1 movie
export const getMovieById = async (movieId: number): Promise<Movie> => {
  return apiClient.get<Movie>(`/movie/${movieId}`)
}

// Tạo movie mới
export const createMovie = async (data: Partial<Movie>): Promise<Movie> => {
  return apiClient.post<Movie>("/movie", data)
}

// Cập nhật movie
export const editMovie = async (movieId: number, data: Partial<Movie>): Promise<Movie> => {
  return apiClient.put<Movie>(`/movie/${movieId}`, data)
}

// Duyệt movie (approve)
export const approveMovie = async (movieId: number): Promise<Movie> => {
  return apiClient.patch<Movie>(`/movie/approve/${movieId}`)
}

// Vô hiệu hóa movie
export const disableMovie = async (data: { movieIds: number[] }): Promise<{ success: boolean }> => {
  return apiClient.put<{ success: boolean }>("/movie/disable", data)
}

// Upload poster cho movie
export const uploadMoviePosters = async (
  movieId: number,
  files: File[],
  makePrimary = false
): Promise<UploadResult> => {
  const formData = new FormData()
  files.forEach(file => formData.append("posters", file))
  if (makePrimary) formData.append("isPrimary", "1")

  return apiClient.postForm<UploadResult>(`/movies/${movieId}/posters`, formData)
}

export const uploadMovieTrailers = async (
  movieId: number,
  files: File[],
  makePrimary = false
): Promise<UploadResult> => {
  const formData = new FormData()
  files.forEach(file => formData.append("trailers", file))
  if (makePrimary) formData.append("isPrimary", "1")

  return apiClient.postForm<UploadResult>(`/movies/${movieId}/trailers`, formData)
}
