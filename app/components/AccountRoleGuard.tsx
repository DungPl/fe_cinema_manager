import {  useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "~/stores/authAccountStore"

interface AccountRoleGuardProps {
  children: ReactNode
  allow: string[]
}

export function AccountRoleGuard({
  children,
  allow,
}: AccountRoleGuardProps) {
  const location = useLocation()
  const account = useAuthStore(state => state.account)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setChecking(false) // chờ Zustand hydrate
  }, [])

  if (checking) return null
  if (!account) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // ❌ SAI ROLE
  if (!allow.includes(account.role)) {
    return <Navigate to="/forbidden" replace />
  }

  // ✅ OK
  return <>{children}</>
}
