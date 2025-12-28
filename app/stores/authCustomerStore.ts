// src/stores/authStore.ts
import { create } from "zustand"
import    {apiClient}  from "~/lib/api/client"

export interface Customer {
  id?: number
  email: string
  username?: string
  phone?: string
  firstname?: string
  lastname?: string
  avatarUrl?: string // ← optional
}
 interface ApiResponse<T> {
  status: string
  message?: string
  data: T
}
export interface CustomerLogin {
  email: string
  password :string
}
interface AuthState {
  customer: Customer | null
  isAuthenticated: boolean
  loginCustomer: (c: Customer) => void
  logoutCustomer: () => void
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,

  loginCustomer: (customer) =>
    set({ customer, isAuthenticated: true }),

  logoutCustomer: () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    set({ customer: null, isAuthenticated: false })
  },

  initAuth: async () => {
    const token = localStorage.getItem("accessToken")
    if (!token) return

    try {
      const res = await apiClient.get<ApiResponse<Customer>>("/khach-hang/me")

      set({
        customer: res.data, // ✅
        isAuthenticated: true,
      })
    } catch {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      set({ customer: null, isAuthenticated: false })
    }
  },
}))
