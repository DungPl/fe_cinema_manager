import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Film,
  Search,
  Bell,
  Ticket,
  Home,
  MapPin,
} from "lucide-react"

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

import { CinemaDialog } from "./CinemaDialog"
import { getCinemas } from "~/lib/api/cinemaApi"
import slugify from "slugify"
import { useAuthStore } from "~/stores/authCustomerStore"

export default function Navbar() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const [openCinema, setOpenCinema] = useState(false)
  const [selectedCinema, setSelectedCinema] = useState<any>(null)
  const user = useAuthStore((s) => s.customer)
  const logout = useAuthStore((s) => s.logoutCustomer)

  const bookings: any[] = [] // demo

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* ---------- Logo ---------- */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <div className="bg-linear-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-purple-600">
                  CinemaHub
                </h1>
                <p className="text-xs text-gray-500">
                  Đặt vé nhanh chóng
                </p>
              </div>
            </button>

            {/* ---------- Main Nav ---------- */}
            <nav className="hidden md:flex items-center gap-4">

              {/* Rạp */}
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setOpenCinema(true)}
              >
                <MapPin className="w-4 h-4" />
                {selectedCinema ? selectedCinema.name : "Rạp"}
              </Button>

              {/* Lịch chiếu */}
              {/* <NavLink to="/lich-chieu">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"}>
                    Lịch chiếu
                  </Button>
                )}
              </NavLink> */}

              {/* Phim */}
              <NavLink to="/movies">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"}>
                    Phim
                  </Button>
                )}
              </NavLink>
            </nav>

            {/* ---------- Search ---------- */}
            <div className="flex-1 max-w-lg hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm phim, rạp chiếu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10!"
                />
              </div>
            </div>

            {/* ---------- Right actions ---------- */}
            <div className="flex items-center gap-2">

              {/* <NavLink to="/">
                <Button variant="ghost" size="icon">
                  <Home className="w-5 h-5" />
                </Button>
              </NavLink> */}

              <NavLink to="/my-tickets">
                <Button variant="ghost" size="icon" className="relative">
                  <Ticket className="w-5 h-5" />
                  {bookings.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs"
                    >
                      {bookings.length}
                    </Badge>
                  )}
                </Button>
              </NavLink>

              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>

             
              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={user.avatarUrl || undefined}
                          alt={user.username}
                        />
                        <AvatarFallback>
                          {(
                            user.firstname ||
                            user.username ||
                            user.email ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Tài khoản
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        logout()
                        navigate("/login")
                      }}
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/login")}>
                  Đăng nhập
                </Button>
              )}



            </div>
          </div>
        </div>
      </header>

      {/* ---------- Cinema Dialog ---------- */}
      <CinemaDialog
        open={openCinema}
        onOpenChange={setOpenCinema}
        cinemas={[]}
        onSelect={(cinema) => {
          setSelectedCinema(cinema)
          const slug = slugify(cinema.name, {
            lower: true,
            strict: true,
            locale: "vi",
          })
          navigate(`/rap/${slug}`)
        }}
      />
    </>
  )
}