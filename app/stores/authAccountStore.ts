// src/stores/authAccountStore.ts
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
  isTicketSeller: boolean
  isLoading: boolean
}

// ✅ CHỈ DÙNG PERSIST KHI Ở CLIENT (window tồn tại)
const useAuthStore = create<AuthState>()(
  typeof window !== "undefined"
    ? persist(
        (set) => ({
          account: null,
          isAdmin: false,
          isManager: false,
          isModerator: false,
          isTicketSeller: false,
          isLoading: true,

          login: (account) => {
            set({
              account,
              isAdmin: account.role === "ADMIN",
              isManager: account.role === "MANAGER",
              isModerator: account.role === "MODERATOR",
              isTicketSeller: account.role === "STAFF",
              isLoading: false,
            })
          },

          logout: () => {
            set({
              account: null,
              isAdmin: false,
              isManager: false,
              isModerator: false,
              isTicketSeller: false,
              isLoading: false,
            })
          },
        }),
        {
          name: "auth-account",
          partialize: (state) => ({ account: state.account }),
          onRehydrateStorage: () => (state) => {
            if (state) state.isLoading = false
          },
        }
      )
    : (set) => ({
        // Fallback khi SSR – không persist
        account: null,
        isAdmin: false,
        isManager: false,
        isModerator: false,
        isTicketSeller: false,
        isLoading: false,

        login: (account) =>
          set({
            account,
            isAdmin: account.role === "ADMIN",
            isManager: account.role === "MANAGER",
            isModerator: account.role === "MODERATOR",
            isTicketSeller: account.role === "STAFF",
            isLoading: false,
          }),

        logout: () =>
          set({
            account: null,
            isAdmin: false,
            isManager: false,
            isModerator: false,
            isTicketSeller: false,
            isLoading: false,
          }),
      })
)

export { useAuthStore }