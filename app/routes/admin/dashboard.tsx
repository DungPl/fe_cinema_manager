import { redirect, useLoaderData } from "react-router"
import { useAuthStore } from "~/stores/authAccountStore"  // ĐÚNG ~

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url)
  const redirectTo = url.pathname + url.search
  const cookieHeader = request.headers.get("cookie");
  // DÙNG PROXY → KHÔNG CÒN LỖI "Failed to parse URL"
  const res = await fetch("http://localhost:8002/api/v1/account/me", {
     headers: { cookie: cookieHeader || "" },
    credentials: "include",
  })

  console.log("[loader /admin] Status:", res.status)

  if (!res.ok || res.status === 401) {
    return redirect(`/authen/login`)
  }

  let user
  try {
    const data = await res.json()
    user = data.user || data.data || data
  } catch (e) {
    return redirect(`/authen/login`)
  }

  // BẢO VỆ 100% TRƯỚC KHI ĐỌC .role
  if (!user || typeof user !== "object" || !user.role) {
    return redirect("/forbidden")
  }

  if (user.role.toLowerCase() !== "admin") {
    return redirect("/forbidden")
  }

  useAuthStore.getState().login(user)
  return { user }
}
export default function AdminDashboard() {
  const { user } = useLoaderData() as { user: { username: string; role: string } }


  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4 text-primary">
        Chào mừng Admin {user.username}!
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Bạn đang ở trang quản trị hệ thống CinemaPro
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-8 rounded-xl shadow-lg border hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-muted-foreground">Tổng phim</h3>
          <p className="text-5xl font-bold text-primary mt-4">48</p>
          <p className="text-sm text-muted-foreground mt-2">+12 phim mới tuần này</p>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-muted-foreground">Doanh thu hôm nay</h3>
          <p className="text-5xl font-bold text-green-600 mt-4">127.5tr</p>
          <p className="text-sm text-green-600 mt-2">+18.5% so với hôm qua</p>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold text-muted-foreground">Vé đã bán</h3>
          <p className="text-5xl font-bold text-blue-600 mt-4">1,284</p>
          <p className="text-sm text-blue-600 mt-2">85% suất chiếu đã đầy</p>
        </div>
      </div>
    </div>
  )
}