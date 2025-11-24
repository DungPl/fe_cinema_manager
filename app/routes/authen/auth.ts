// app/api/auth.ts
import { http } from "../http"

// login
export async function login(username: string, password: string) {
  return http.post("/auth/login", { username, password })
}