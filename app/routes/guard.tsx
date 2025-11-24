import type { JSX } from "react";
import { Navigate } from "react-router-dom"

export function RequireRole({ children, allow }: { children: JSX.Element; allow: string[] }) {
  const token = localStorage.getItem("access_token")
  if (!token) return <Navigate to="/login" replace />

  // Giả sử backend encode role trong localStorage (hoặc bạn decode JWT)
  const role = localStorage.getItem("role") // VD: admin | manager | moderator | seller | customer

  if (!allow.includes(role || "")) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
