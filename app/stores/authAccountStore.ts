import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Account {
  id: number
  username: string
  role: string
}

interface AuthState {
  account: Account | null
  login: (account: Account) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      account: null,
      login: (account) => set({ account }),
      logout: () => set({ account: null }),
    }),
    {
      name: "auth-account", // key trong localStorage
    }
  )
)
