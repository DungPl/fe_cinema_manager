
import { apiClient } from "./client"
import type { 
  LocationResponse, 
  CinemaChainWithCount, 
  Cinema, 
  Showtime 
} from "./types";

// Get locations (provinces with counts) - assuming endpoint /cinema-locations
export const getCinemaLocations = async (): Promise<LocationResponse[]> => {
  return apiClient.get<LocationResponse[]>("/chuoi-rap/tinh");
};

// Get chains by area
export const getCinemaChainsByArea = async (
  province?: string
): Promise<CinemaChainWithCount[]> => {
  return apiClient.get<CinemaChainWithCount[]>("/cinema-chains-by-area", {
    params: { province },
  });
};

// Get cinemas
export const getCinemas = async (
  chainId: number,
  province?: string
): Promise<Cinema[]> => {
  return apiClient.get<Cinema[]>("/cinemas", {
    params: { chainId, province },
  });
};

// Get showtimes
export const getShowtimes = async (
  cinemaId: number,
  date?: string
): Promise<Showtime[]> => {
  return apiClient.get<Showtime[]>("/showtimes", {
    params: { cinemaId, date },
  });
};