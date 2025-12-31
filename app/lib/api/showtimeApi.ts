import type { AutoGenerateResponse, CreateShowtimeBatchInput, FilterShowtimeParams, HoldSeatRequest, HoldSeatResponse, PurchaseSeatsRequest, PurchaseSeatsResponse, ReleaseSeatRequest, Seat, SeatsData, SeatType, Showtime, ShowtimeResponse, UpdateShowtime } from "~/lib/api/types";
import { apiClient } from "./client";
interface ApiResponse<T> {
  status: string;
  data: T;
}
export const getShowtimes = async (
  filters: FilterShowtimeParams
): Promise<ShowtimeResponse[]> => {
  // Loại bỏ undefined/null/""
  const params: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      // Chuẩn hóa key thành lowercase để match server
      const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1); // Ví dụ: Province → province, CinemaId → cinemaId
      params[normalizedKey] = value;
    }
  });

  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: ShowtimeResponse[]
  }>("/showtime", params);

  // Trả về đúng data
  return response.data;
};
export const getShowtimeByCinemaAndDate = async (
  cinemaId: number,
  date: string
): Promise<Showtime[]> => {
  const res = await apiClient.get<Showtime[]>(
    `/showtime/${cinemaId}`,
    {
      params: cinemaId, date,
    }
  );

  return res; // Không còn unknown
};
interface ShowtimeSeat {
   ShowtimeId:number      
    SeatId :    number     
    SeatRow  :  string  
    SeatTypeId: number     
    Status  :   string    
    Showtime :  Showtime  
    SeatType  : SeatType   
    Seat  :     Seat      
}
export const getHeldSeatBySessionId = async ( 
  code: string,
  sessionId: string
): Promise<ShowtimeSeat> => {
  const res = await apiClient.get<ShowtimeSeat>(
    `/lichchieu/${code}/ghe-giu`,
    {
      params: code, sessionId,
    }
  );

  return res; 
};
export const getShowtimeByPublicCode = async (code: string): Promise<Showtime> => {
  const res = await apiClient.get<ApiResponse<Showtime>>(`/lich-chieu/dat-ve/${code}`);
  return res.data; // Trả về res.data để khớp type Showtime
};
interface RawSeat {
  id: number;
  label: string;
  type: "NORMAL" | "VIP" | "COUPLE";
  status: "AVAILABLE" | "BOOKED" | string; // Thêm status khác nếu cần
}
export type SeatsByRowResponse = Record<
  string,
  {
    id: number
    label: string
    type: "NORMAL" | "VIP" | "COUPLE"
    status: "AVAILABLE" | "HELD" | "BOOKED"
    heldBy?: string
    expiredAt?: string
  }[]
>

export interface ApiSuccess<T> {
  status: "success"
  data: T
}

export async function getSeatsByShowtime(code: string) {
  return apiClient.get<ApiSuccess<SeatsByRowResponse>>(
    `/lich-chieu/${code}/ghe`
  )
}

function getPriceModifier(type: string): number {
  switch (type) {
    case "NORMAL": return 1;
    case "VIP": return 1.5;
    case "COUPLE": return 2;
    default: return 1;
  }
}
import { getGuestSessionId } from "~/lib/utils"

export const holdSeats = async (
  code: string,
  payload: HoldSeatRequest
): Promise<HoldSeatResponse> => {
  const guestSessionId = getGuestSessionId()

  const res = await apiClient.post<ApiResponse<HoldSeatResponse>>(
    `/lich-chieu/${code}/giu-ghe`,
    {
      seatIds: payload.seatIds,
      guestSessionId,
    }
  )

  return res.data
}

export const releaseSeats = async (
  code: string,
  payload: ReleaseSeatRequest
): Promise<void> => {
  await apiClient.post(
    `/lich-chieu/${code}/tra-ghe`,
    payload
  )
}
export const purchaseSeats = async (
  code: string,
  request: PurchaseSeatsRequest
): Promise<PurchaseSeatsResponse> => {
  const res = await apiClient.post<ApiResponse<PurchaseSeatsResponse>>(
    `/lich-chieu/${code}/thanh-toan`,
    request
  )

  return res.data
}


export const createShowtimeBatch = async (
  data: CreateShowtimeBatchInput
): Promise<AutoGenerateResponse> => {
  const res = await apiClient.post<AutoGenerateResponse>(
    "/showtime/auto-generate",
    data
  );

  return res;  // không dùng res.data nữa
};
export const updateShowtime = async (showtimeId: number, data: UpdateShowtime): Promise<{ message: string }> => {
  return apiClient.put(`/showtime/${showtimeId}`, data)
}
export const deleteShowtime = async (id: number) => {
  return apiClient.delete(`/showtime/${id}`);
};


export interface StaffShowtime {
  id: number
  publicCode: string
  movieTitle: string
  startTime: string
  posterUrl:string
  price: number
}
export const getStaffShowtimes = async (): Promise<StaffShowtime[]> => {
  const res = await apiClient.get<{
    success: boolean
    data: StaffShowtime[]
  }>("/showtime/staff")

  return res.data
}
