// app/loaders.ts
import { redirect } from "react-router"

export function emptyLoader() {
  return {}
}

export function notFoundLoader() {
  return { status: 404 }
}

export function forbiddenLoader() {
  return { status: 403 }
}

export function requireAuth(requiredRole?: string) {
  return async () => {
    const token = localStorage.getItem("access_token")
    const role = localStorage.getItem("role")

    if (!token) return redirect("/login")
    if (requiredRole && role !== requiredRole) return redirect("/forbidden")

    return { user: { role } }
  }
}
