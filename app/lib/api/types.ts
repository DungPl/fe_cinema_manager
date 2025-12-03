
// ~/lib/api/types.ts
export interface ApiResponse<T> {
  success: boolean
  message?: string
  // data: T[] | {
  //   rows: T[]
  //   total?: number
  // }
  // rows?: T[]  // fallback nếu backend trả trực tiếp
  // total?: number\
  data: {
    rows: T[]
    total?: number
  }
}
export interface PaginatedResponse<T>{
   rows: T[];
  limit: number;
  page: number;
  totalCount: number;
}
export interface PaginatedApiResponse<T>{
  status: string; // hoặc success boolean nếu muốn
  data: PaginatedResponse<T>;
}
export interface AdminStatsResponse {
  status: string
  data: AdminStats
}
export interface AdminStats {
  todayRevenue: number
  todayTickets: number
  upcomingShows: number
  revenueGrowth: number
  ticketsGrowth: number
  showsGrowth: number
  chains: number,
  cinemas: number,
  rooms: number,
  movies: number,
  customers: number,
}

export interface AdminStatsv3 {
  TodayRevenue: number
  YesterdayRevenue: number
  ThisWeekRevenue: number
  ThisMonthRevenue: number

  TodayTickets: number
  YesterdayTickets: number

  UpcomingShows: number

  TopMovies: string

  RoomFullRate: number
  LowAttendanceRate: number
}
export interface CinemaChain {
  id: number
  name: string
  description: string
  logoUrl?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}
interface MapPickerProps {
  initialLat: number
  initialLng: number
  onChange: (lat: number, lng: number, address: string) => void
}
export interface Address {
  id?: number
  house_number: string
  street: string
  ward: string
  district: string
  province: string
  fullAddress: string
  latitude?: number
  longitude?: number
  cinemaId?: number
}
export interface FilterCinemaParams {
  page?: number
  limit?: number
  searchKey?: string
  province?: string
  district?: string
  chainId?: number
  chainName?: string
}

export interface CinemaListResponse {
  rows: Cinema[]
  totalCount: number
  limit: number
  page: number
}
export interface Cinema {
  roomCount?: number

  id?: number
  name: string
  phone: string
  isActive: boolean
  chainId: number
  createdAt?: string
  updatedAt?: string
  address?: Address[]  // <-- Lưu ý đây là mảng
  rooms?: any[]          // nếu muốn preload phòng chiếu
  promotions?: any[]     // nếu muốn preload khuyến mãi
}
export interface UpdateCinemaInput {
  name?: string
  chainId: number
  phone?: string
  active?: boolean
  address?: {  // ← cho phép undefined
    house_number?: string
    street: string
    ward: string
    district: string
    province: string
    fullAddress: string
    latitude: number
    longitude: number
  } | null | undefined   // ← THÊM DÒNG NÀY!
}

export interface CreateCinemaInput {
  name: string
  chainId: number
  phone?: string
  address: {  // bắt buộc khi tạo mới
    house_number?: string
    street: string
    ward: string
    district: string
    province: string
    fullAddress: string
    latitude: number
    longitude: number
  }
}
export interface Format {
  id: number
  name: string
}
export interface CreateRoomInput {
  cinemaId: number
  roomNumber: number
  row: string
  columns: number
  formatIds: number[]
  vipColMin?: number
  vipColMax?: number
}

export interface UpdateRoomInput {
  name?: string
  roomNumber?: number
  capacity?: number
  row?: string
  status?: string
  formatIds?: number[]
}
export interface Room {
  id: number
  name: string
  cinemaId: number
  roomNumber: number
  capacity: number
  status: string
  row: string
  type: string
  seats: Seat[]
  formats: Format[]
  createdAt: string
  updatedAt: string
}
export interface SeatType {
  id: number
  type: "NORMAL" | "VIP" | "COUPLE";
  priceModifier: number
}
export interface Seat {
  id: number
  row: string
  column: number
  isAvailable: boolean
  SeatType: SeatType
}
export interface Director {
  id: number
  name: string
  nationality: string
  avatar: string
  biography: string
}
export interface CreateDirectorInput {
  name: string
  nationality?: string
  avatar?: string
  biography?: string
}
export interface UpdateDirectorInput {
  name?: string
  nationality?: string
  avatar?: string
  biography?: string
}

export interface Actor {
  id: number
  name: string
  nationality?: string
  avatar?: string
  biography: string
}
export interface CreateActors {
  name: string
}
export interface UpdateActor {
  name?: string
  nationality?: string
  avatar?: string
  biography?: string
}
export interface AccountModerator {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  username: string
  password: string
  accessToken: string
  refreshToken: string
  active: boolean
  role: string
  cinemaId: number | null
  staff: any | null
  cinema: Cinema
}
export interface MoviePoster {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  movieId: number
  url: string
  isPrimary: boolean
}

// Trailer
export interface MovieTrailer {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  movieId: number
  url: string
  isPrimary: boolean
}
export interface UploadResult {
  movie: Movie
  uploaded: (MoviePoster | MovieTrailer)[]
  failed: { filename: string; error: string }[]
  success_count: number
  failed_count: number
}
export interface Movie {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  genre: string
  title: string
  duration: number
  language: string
  description: string
  country: string
  posters: MoviePoster[]
  trailers: MovieTrailer[]
  directorId: number
  director: Director
  actors: Actor[]
  ageRestriction: string
  formats: Format[]
  dateSoon: string | null
  dateRelease: string | null
  dateEnd: string | null
  statusMovie: string
  isAvailable: boolean
  accountModeratorId: number
  accountModerator: AccountModerator
}
export interface PaginatedMovieResponse {
  rows: Movie[]
  limit: number | null
  page: number | null
  totalCount: number
}
export interface CreateMovieInput {
  genre: string
  title: string
  duration: number
  language: string
  description: string
  country: string
  directorId?: number        // hoặc directorName
  directorName?: string
  actorIds?: number[]
  actorNames?: string[]
  formatIds: number[]
  ageRestriction: "P" | "K" | "T13" | "T16" | "T18"
  dateSoon?: string          // dùng string ISO "YYYY-MM-DD"
  dateRelease: string        // bắt buộc
  dateEnd?: string
}
