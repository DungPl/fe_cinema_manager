
// ~/lib/api/types.ts
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: {
    rows: T[]
    total?: number
  }
}
export interface PaginatedResponse<T> {
  rows: T[];
  limit: number | null;
  page: number | null;
  totalCount: number;
}
export interface PaginatedApiResponse<T> {
  status: string; // hoặc boolean nếu muốn
  data: PaginatedResponse<T>;
}
export interface ApiResponseOne<T> {
  success: boolean
  message?: string
  data: T
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
  fullAddress: string
  latitude: number
  longitude: number

  house_number?: string
  street?: string
  ward?: string
  district?: string
  province?: string

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
  description: string
  isActive: boolean
  chainId: number
  createdAt?: string
  updatedAt?: string
  chain: CinemaChain
  address: Address[]  // <-- Lưu ý đây là mảng
  rooms?: any[]          // nếu muốn preload phòng chiếu
  promotions?: any[]     // nếu muốn preload khuyến mãi
}
export interface UpdateCinemaInput {
  name?: string
  chainId: number
  phone?: string
  active?: boolean
  description?: string
  address?: {  // ← cho phép undefined
    house_number?: string
    street?: string
    ward?: string
    district?: string
    province?: string
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
    street?: string
    ward?: string
    district?: string
    province?: string
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
  hasCoupleSeat: boolean
}

export interface UpdateRoomInput {
  name?: string
  roomNumber?: number
  capacity?: number

  status?: string
  formatIds?: number[]
  seat?: {
    hasCoupleSeat?: boolean
    row?: string
    columns?: number,
    vipColMin?: number,
    vipColMax?: number,
  }

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
  hasCoupleSeat: boolean
  cinema: Cinema
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
export interface SeatRow {
  row: string; // Nhãn row (ví dụ: 'A', 'B')
  seats: Seat[];
}
export type SeatStatus = "AVAILABLE" | "HOLD" | "BOOKED"
export interface BookingSeat {
  id: number
  label: string
  type: "NORMAL" | "VIP" | "COUPLE"
  status: SeatStatus
  isAvailable: boolean
  heldBy?: string
  expiredAt?: string
}
export interface BookingSeatRow {
  row: string
  seats: BookingSeat[]
}
export interface HoldSeatRequest {
  seatIds: number[]
 
}

export interface HoldSeatResponse {
  heldSeatIds: number[]
  expiresAt: string
  sessionId?: string // chỉ có khi guest
}
export interface ReleaseSeatRequest {
  seatIds: number[]
  heldBy: string
}
export type ReleaseSeatResponse = string
export interface PurchaseSeatsRequest {
  seatIds: number[];
  heldBy: string;
  name: string;
  phone: string;
  email: string;
  discountCode?: string;
}

export interface PurchaseSeatsResponse {
  message: string;
}
export type SeatsByRowResponse = Record<string, {
  id: number
  label: string
  type: "NORMAL" | "VIP" | "COUPLE"
  status: SeatStatus
}[]>
export type SeatsData = SeatRow[];
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
export interface DirectorParams {
  search?: string;
  page?: number;
  limit?: number;
}
export interface ActorParams {
  search?: string;
  page?: number;
  limit?: number;
}
export type TicketStatus =
  "RESERVED"   // đã giữ chỗ (chưa thanh toán)
  | "PAID"     // vé hợp lệ
  | "CANCELLED"
export interface Ticket {
  id: number
  bookingTime: string
  status: string
  bookingCode: string
  price: number
  reservationId: number
  showtimeId: number
  seatId: number

  // preload
  seat?: Seat
}
export interface CreateShowtimeInput {
  movieId: number
  roomId: number
  startTime: string
  endTime?: string        // nếu backend tự tính thì optional
  basePrice: number
}
export interface CreateReservationInput {
  showtimeId: number
  seatIds: number[]        // list ghế chọn
  customerId?: number | null
}
export interface CreateTicketInput {
  reservationId: number
  seatId: number
  price: number
}
export type ShowtimeStatus = "UPCOMING" | "ONGOING" | "ENDED"
export interface Showtime {
  id: number
  movieId: number
  roomId: number
  price: number
  start: string
  end: string
  publicCode: string
  Movie: Movie
  Room: Room
  format: string
  tickets: Ticket[]
}
export type AutoGenerateResponse = {
  status: string;
  data: {
    message: string;
    created: number;
    skipped: number;
    totalDays: number;
    totalRooms: number;
  };
};

export interface ShowtimeResponse {
  id: number
  price: number
  movie: Movie
  room: Room
  start_time: string
  end_time: string

  fill_rate: number        // tỉ lệ lấp phòng %
  booked_seats: number     // số ghế đã đặt
  total_seats: number      // tổng số ghế
}
export interface FilterShowtimeParams {
  showingStatus?: "UPCOMING" | "ONGOING" | "ENDED"
  movieId?: number
  roomId?: number
  cinemaId?: number
  province?: string
  district?: string
  ward?: string
  startDate?: string
  endDate?: string

  limit?: number
  page?: number
}
export interface CreateShowtimeBatchInput {
  movieId: number;
  roomIds: number[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  formats: string[]; // ["2D", "3D"]
  timeSlots: string[]; // ["18:30", "20:45"]
}
export interface UpdateShowtime {
  movieId: number;
  roomIds: number[];
  start_time: string
  price: number
}
export interface MovieWithShowtimes {
  movie: Movie
  showtimes: Showtime[]
}
export interface MovieWithShowtimesResponse {
  data: MovieWithShowtimes[]
  status: string
}