
// ~/lib/api/types.ts
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data:T[] | {
    rows: T[]
    total?: number
  }
  rows?: T[]  // fallback nếu backend trả trực tiếp
  total?: number
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
export interface Format{
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
  roomNumber:number
  capacity: number
  status: string
  row: string
  seats:Seat[]
  formats: Format[]
  createdAt: string
  updatedAt: string
}
export interface SeatType{
  id:number
  type: "NORMAL" | "VIP" | "COUPLE" ;
  priceModifier:number
}
export interface Seat{
  id: number
  row: string
  column: number
  isAvailable:boolean
  seatType:SeatType
}