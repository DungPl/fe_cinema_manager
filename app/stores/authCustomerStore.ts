// src/stores/authStore.ts
import { create } from "zustand"

export interface Customer {
  id: number
  email: string
  username: string
  phone:string
  firstname?: string
  lastname?: string
  avatarUrl:string
}

interface AuthState {
  account: any | null        // admin / staff
  customer: Customer | null  // người dùng đặt vé

  loginCustomer: (c: Customer) => void
  logoutCustomer: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  account: null,
  customer: null,

  loginCustomer: customer => set({ customer }),
  logoutCustomer: () => set({ customer: null }),
}))
