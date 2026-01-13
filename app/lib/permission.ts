import type { UserRole } from "~/lib/api/types";

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin routes

  "/admin": ["ADMIN", "MANAGER", "MODERATOR"],
  "/admin/cinema-chains": ["ADMIN"],
  "/admin/cinemas": ["ADMIN", "MANAGER"],
  "/admin/cinemas/:cinemaId/rooms": ["ADMIN", "MANAGER"],
  "/admin/showtime": ["ADMIN", "MANAGER"],
  "/admin/reports": ["ADMIN", "MANAGER"],
  "/admin/reports/no-show": ["ADMIN", "MANAGER"],
  "/admin/reports/staff-checkin": ["ADMIN", "MANAGER"],
  "/admin/reports/no-show-tickets":["ADMIN", "MANAGER"],
  "/admin/movie": ["ADMIN", "MODERATOR"],
  "/admin/staff/index":["ADMIN"],
  "/admin/movie/actors": ["ADMIN", "MODERATOR"],
  "/admin/movie/directors": ["ADMIN", "MODERATOR"],
  "/admin/staff/create_ticket": ["STAFF"]
};