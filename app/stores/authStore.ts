// src/app/stores/authStore.ts
import { create } from "zustand"

export interface User {
  id: number
  username: string
  role: string
}

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const authStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

// Hook chỉ dùng trong component
export const useAuthStore = authStore