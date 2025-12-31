import type { UserRole } from "~/lib/api/types";

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin routes
    
  "/admin":["ADMIN","MANAGER"],
  "/admin/cinema-chains": ["ADMIN"],
  "/admin/cinemas": ["ADMIN", "MANAGER"],
  "/admin/cinemas/:cinemaId/rooms": ["ADMIN", "MANAGER"],
  "/admin/showtime": ["ADMIN", "MANAGER"],

  "/admin/movie": ["ADMIN", "MODERATOR"],
  "/admin/movie/actors": ["ADMIN", "MODERATOR"],
  "/admin/movie/directors": ["ADMIN", "MODERATOR"],
  "/admin/staff/create_ticket":["STAFF"]
};