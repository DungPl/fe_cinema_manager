// components/Navbar.tsx
import { useNavigate, NavLink } from "react-router-dom"
import {
  Film,
  Search,
  Bell,
  Ticket,
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
import slugify from "slugify"
import { useAuthStore } from "~/stores/authCustomerStore" // Import store
import { useState } from "react"

export default function Navbar() {
  const navigate = useNavigate()

  const { customer, logoutCustomer } = useAuthStore() // Lấy user và logout từ store

  const [searchQuery, setSearchQuery] = useState("")
  const [openCinema, setOpenCinema] = useState(false)
  const [selectedCinema, setSelectedCinema] = useState<any>(null)

  // Xử lý tìm kiếm
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Xử lý logout
  const handleLogout = () => {
    logoutCustomer() // Gọi logout từ store (xóa token, set customer null)
    navigate("/login")
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
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

            {/* Main Nav */}
            <nav className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setOpenCinema(true)}
              >
                <MapPin className="w-4 h-4" />
                {selectedCinema ? selectedCinema.name : "Rạp"}
              </Button>

              <NavLink to="/phim">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"}>
                    Phim
                  </Button>
                )}
              </NavLink>
            </nav>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-lg hidden lg:flex items-center relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm phim, rạp chiếu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10! pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch()
                  }
                }}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2"
                  onClick={() => {
                    setSearchQuery("")
                    navigate("/")
                  }}
                >
                  ✕
                </Button>
              )}
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <NavLink to="/ve-cua-toi">
                <Button variant="ghost" size="icon" className="relative">
                  <Ticket className="w-5 h-5" />
                  {/* {bookings.length > 0 && ( */}
                  {/*   <Badge */}
                  {/*     variant="destructive" */}
                  {/*     className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs" */}
                  {/*   > */}
                  {/*     {bookings.length} */}
                  {/*   </Badge> */}
                  {/* )} */}
                </Button>
              </NavLink>

              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>

              {/* User / Login */}
              {customer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={customer.avatarUrl || undefined}
                          alt={customer.username}
                        />
                        <AvatarFallback>
                          {(customer.username || customer.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block font-medium">
                        {customer.username || customer.email.split("@")[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Tài khoản
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={handleLogout}
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