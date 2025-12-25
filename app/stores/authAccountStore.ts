import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "~/lib/api/types"

export interface Account {
  id: number
  username: string
  role: UserRole
  cinemaId?: number | null
}

interface AuthState {
  account: Account | null
  login: (account: Account) => void
  logout: () => void
  isAdmin: boolean
  isManager: boolean
  isModerator: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      account: null,
      login: (account) => set({ account }),
      logout: () => set({ account: null }),
      get isAdmin() {
        return get().account?.role === "ADMIN"
      },
      get isManager() {
        return get().account?.role === "MANAGER"
      },
      get isModerator() {
        return get().account?.role === "MODERATOR" 
        
      },
       get isTicketSeller() {
        return get().account?.role === "SELLER" 
        
      },
    }),
    {
      name: "auth-account",
    }
  )
)