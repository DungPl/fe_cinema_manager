import {  useEffect, useState } from "react"
import type { ReactNode } from "react"
import {  useLocation,useNavigate } from "react-router"
import { useAuthStore } from "~/stores/authAccountStore"

interface AccountRoleGuardProps {
  children: ReactNode
  allow: string[]
}

export function AccountRoleGuard({
  children,
  allow,
}: AccountRoleGuardProps) {
    const navigate = useNavigate()
  const location = useLocation()
  const account = useAuthStore(state => state.account)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setChecking(false) // chờ Zustand hydrate
  }, [])

  if (checking) return null
  if (!account) {
    return (
       navigate("/admin/login")
    )
  }

  // ❌ SAI ROLE
  if (!allow.includes(account.role)) {
     navigate("/forbidden")
  }

  // ✅ OK
  return <>{children}</>
}
