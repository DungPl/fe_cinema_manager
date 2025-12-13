// ~/lib/api/movieApi.ts
import { apiClient } from "./client"
import type { Actor, ActorParams, ApiResponse, ApiResponseOne, Director, DirectorParams, Movie, PaginatedApiResponse, PaginatedMovieResponse, UploadResult } from "./types"

// Lấy danh sách movie (có phân trang & search)
export const getMovies = (params?: { page?: number; limit?: number; search?: string;  showingStatus?: "COMING_SOON" | "NOW_SHOWING" | "ENDED" }) => {
  return apiClient.get<PaginatedApiResponse<Movie>>("/movie", params)
    .then(res => ({
      rows: res.data.rows,
      limit: res.data.limit,
      page: res.data.page,
      totalCount: res.data.totalCount,
    }))
}
export const getDirectors = (params: DirectorParams = {}) => {
  return apiClient.get<PaginatedApiResponse<Director>>("/director", params);
}

export const getActors = (params: ActorParams = {}) => {
  return apiClient.get<PaginatedApiResponse<Actor>>("/actor", params);
}
// Lấy chi tiết 1 movie
export const getMovieById = async (movieId: number): Promise<Movie> => {
  const res = await apiClient.get<ApiResponseOne<Movie>>(`/movie/${movieId}`)
  return res.data   // <-- LẤY ĐÚNG MOVIE OBJECT
}

// Tạo movie mới
export const createMovie = async (formData: FormData): Promise<Movie> => {
  return apiClient.postForm<Movie>("/movie", formData)
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
export const disableMovie = async (data: { ids: number[] }): Promise<{ success: boolean }> => {
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
