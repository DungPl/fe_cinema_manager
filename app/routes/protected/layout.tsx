// src/app/routes/(protected)/layout.tsx
import { Outlet, redirect } from "react-router-dom"
import { useAuthStore } from "../../stores/authAccountStore"
import { Navbar } from "../../components/layouts/Navbar"
//import { Sidebar } from "../../components/layout/Sidebar"
import { Footer } from "../../components/layouts/Footer"
export async function loader() {
  const res = await fetch("http://localhost:8002/api/v1/account/me", {
    credentials: "include",
  })

  if (!res.ok) {
    return redirect("/auth/login")
  }

  const json = await res.json()
  const user = json.user

  // Lưu vào store
  useAuthStore.getState().login(user)

  return { user }
}

export default function ProtectedLayout() {
 return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <Outlet />   {/* ĐÚNG: Outlet là con DUY NHẤT của <main> */}
      </main>
      <Footer />
    </>
  )
}