
import { apiClient } from "./client"
import type {
  LocationResponse,
  CinemaChainWithCount,
  Cinema,
  Showtime,
  Movie,
  MovieShowtimeResponse
} from "./types";
interface ApiResponse<T> {
  status: string
  data: T
}
// Get locations (provinces with counts) - assuming endpoint /cinema-locations
export const getCinemaLocations = async (): Promise<LocationResponse[]> => {
  const res = await apiClient.get<ApiResponse<LocationResponse[]>>(
    "/chuoi-rap/khu-vuc"
  )
  return res.data
}

// Get chains by area
export const getCinemaChainsByArea = async (
  province?: string
): Promise<CinemaChainWithCount[]> => {
  const res = await apiClient.get<{
    status: string
    data: CinemaChainWithCount[]
  }>("/chuoi-rap/tinh", {
    province,
  })

  return res.data
}


// Get cinemas
export const getCinemas = async (
  chainId: number,
  province?: string
): Promise<Cinema[]> => {
  const res = await apiClient.get<{
    status: string
    data: Cinema[]
  }>("/rap", {
    chainId,
    province,
  })
  return res.data
}


// Get showtimes
export const getShowtimes = async (
  cinemaId: number,
  date?: string
): Promise<Showtime[]> => {
  const res = await apiClient.get<{
    status: string
    data: Showtime[]
  }>("/lich-chieu", {
    cinemaId, date,
  })
  return res.data
};


export const getMovieDetail = async (slug: string): Promise<Movie> => {
  const res = await apiClient.get<{
    status: string
    data: Movie
  }>(`/phim/${slug}`)
  return res.data
}

export const getShowtimesByMovie = async (params: {
  movieId: number
  province: string
  format?: string
  chainId?: number
   date?: string
}): Promise<MovieShowtimeResponse> => {
  const res = await apiClient.get<{
    status: string
    data: MovieShowtimeResponse
  }>("/lich-chieu/phim", {
    movie_id: params.movieId,
    province: params.province,
    format: params.format,
    chain_id: params.chainId,
      date: params.date,  
  })

  return res.data
}

export const searchMovies = async (params: {
  q?: string;
}): Promise<Movie[]> => {
  try {
    const res = await apiClient.get<ApiResponse<Movie[]>>("/phim/search", 
      params,
    );
    return res.data ?? []; // Trả về mảng phim, fallback []
  } catch (error) {
    console.error("Lỗi tìm kiếm phim:", error);
    return []; // Trả về mảng rỗng nếu lỗi
  }
};

export const searchCinemas = async (params: {
  q?: string;
}): Promise<Cinema[]> => {
  try {
    const res = await apiClient.get<ApiResponse<Cinema[]>>("/rap/search", 
      params,
    );
    return res.data ?? []; // Trả về mảng phim, fallback []
  } catch (error) {
    console.error("Lỗi tìm kiếm rạp:", error);
    return []; // Trả về mảng rỗng nếu lỗi
  }
};

export const getMoviesByStatus = async (status: string): Promise<Movie[]> => {
  try {
    const res = await apiClient.get<ApiResponse<Movie[]>>(`/phim/status/${status}`)
    return res.data?? []
  } catch (error) {
    console.error(`Lỗi lấy phim ${status}:`, error)
    return []
  }
}

export const getMovieGenres = async (): Promise<string[]> => {
  try {
    const res = await apiClient.get<ApiResponse<string[]>>("/phim/genres")
    return res.data ?? []
  } catch (error) {
    console.error("Lỗi lấy thể loại phim:", error)
    return []
  }
}