// routes/admin/reports/no-show-tickets.tsx
import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "~/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { CalendarIcon, Search, AlertTriangle, DollarSign, Armchair, Ticket } from "lucide-react"
import { apiClient } from "~/lib/api/client"
import { cn, formatCurrency } from "~/lib/utils" // bạn tự viết helper: num => num.toLocaleString('vi-VN') + 'đ'
import { getCinemas } from "~/lib/api/cinemaApi"
import type { Cinema } from "~/lib/api/types"
import { getMovies } from "~/lib/api/movieApi"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
// Types từ backend
type NoShowTicketItem = {
  orderCode: string
  customerName: string
  phone: string
  email: string
  movieTitle: string
  cinemaName: string
  roomName: string
  showtime: string
  seats: string
  totalAmount: number
  ticketCount: number
  noShowCount: number
}

type NoShowTicketSummary = {
  totalNoShowTickets: number
  totalLostRevenue: number
  totalEmptySeats: number
  averageTicketPrice: number
}

type PaginationInfo = {
  currentPage: number
  totalPages: number
  totalItems: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}
type MovieOption = { id: number; title: string }
type CinemaOption = { id: number; name: string }


// Bộ lọc
export default function NoShowTicketReportPage() {
  const [report, setReport] = useState<NoShowTicketItem[]>([])
  const [summary, setSummary] = useState<NoShowTicketSummary | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Bộ lọc
  const [from, setFrom] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"))
  const [search, setSearch] = useState("")
  const [cinemaId, setCinemaId] = useState("")
  const [movieId, setMovieId] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20

  // List rạp và phim
  const [cinemas, setCinemas] = useState<CinemaOption[]>([])
  const [movies, setMovies] = useState<MovieOption[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [openCinema, setOpenCinema] = useState(false)
  const [openMovie, setOpenMovie] = useState(false)



  // Lấy list rạp và phim
  const fetchFilters = async () => {
    setLoadingFilters(true)
    try {
      const [cinemaRes, movieRes] = await Promise.all([
        getCinemas({ limit: 999 }),
        getMovies({
          limit: 100,
          showingStatus: "NOW_SHOWING",
        }),
      ])

      setCinemas(cinemaRes.rows.map((c) => ({ id: c.id, name: c.name })))
      setMovies(movieRes.rows.map((m) => ({ id: m.id, title: m.title })))
    } catch (err) {
      console.error("Lỗi tải bộ lọc:", err)
    } finally {
      setLoadingFilters(false)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from,
        to,
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search.trim()) params.append("search", search.trim())
      if (cinemaId) params.append("cinemaId", cinemaId)
      if (movieId) params.append("movieId", movieId)

      const res = await apiClient.get<any>(`/report/no-show-ticket?${params.toString()}`)
      setReport(res.data.report || [])
      setSummary(res.data.summary)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error("Lỗi tải báo cáo:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [from, to, search, page, cinemaId, movieId])

  useEffect(() => {
    fetchFilters()
  }, []) // load 1 lần

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReport()
  }

  const handleReset = () => {
    setSearch("")
    setCinemaId("")
    setMovieId("")
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Tiêu đề */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          Danh Sách Vé Không Check-in (No-Show)
        </h1>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Từ ngày</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label>Rạp chiếu</Label>
              <Popover open={openCinema} onOpenChange={setOpenCinema}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCinema}
                    className="w-full justify-between"
                    disabled={loadingFilters}
                  >
                    {cinemaId
                      ? cinemas.find((c) => c.id.toString() === cinemaId)?.name || "Chọn rạp..."
                      : "Tất cả rạp"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={true}> {/* Bật filter tự động */}
                    <CommandInput placeholder="Tìm rạp..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy rạp nào.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all" // value cho tìm kiếm
                          keywords={["tất cả", "all", "tat ca"]} // từ khóa tìm "Tất cả"
                          onSelect={() => {
                            setCinemaId("")
                            setOpenCinema(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", cinemaId === "" ? "opacity-100" : "opacity-0")} />
                          Tất cả rạp
                        </CommandItem>
                        {cinemas.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name} // dùng tên làm value để tìm kiếm dễ hơn
                            keywords={[c.name, c.id.toString()]} // tìm được cả tên và ID
                            onSelect={() => {
                              setCinemaId(c.id.toString())
                              setOpenCinema(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", cinemaId === c.id.toString() ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Phim</Label>
              <Popover open={openMovie} onOpenChange={setOpenMovie}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openMovie}
                    className="w-full justify-between"
                    disabled={loadingFilters}
                  >
                    {movieId
                      ? movies.find((m) => m.id.toString() === movieId)?.title || "Chọn phim..."
                      : "Tất cả phim"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={true}>
                    <CommandInput placeholder="Tìm phim..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy phim nào.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          keywords={["tất cả", "all", "tat ca"]}
                          onSelect={() => {
                            setMovieId("")
                            setOpenMovie(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", movieId === "" ? "opacity-100" : "opacity-0")} />
                          Tất cả phim
                        </CommandItem>
                        {movies.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={m.title} // dùng tiêu đề để tìm kiếm dễ
                            keywords={[m.title, m.id.toString()]}
                            onSelect={() => {
                              setMovieId(m.id.toString())
                              setOpenMovie(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", movieId === m.id.toString() ? "opacity-100" : "opacity-0")} />
                            {m.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Tìm kiếm</Label>
                <Input
                  placeholder="Mã vé, tên, SĐT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Tìm
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Xóa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-600" />
                Tổng Vé Không Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{summary.totalNoShowTickets}</p>
              <p className="text-sm text-muted-foreground">Từ {summary.totalNoShowTickets} vé đã đặt</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                Doanh Thu Bị Mất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(summary.totalLostRevenue)}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Armchair className="w-5 h-5 text-blue-600" />
                Ghế Trống Phí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{summary.totalEmptySeats}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Giá Trị TB/Vé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(Math.round(summary.averageTicketPrice))}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bảng danh sách */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách vé không check-in</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</p>
          ) : report.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Không có vé no-show nào trong khoảng thời gian này 🎉
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Vé</TableHead>
                    <TableHead>Khách Hàng</TableHead>
                    <TableHead>Phim</TableHead>
                    <TableHead>Rạp</TableHead>
                    <TableHead>Suất Chiếu</TableHead>
                    <TableHead>Ghế</TableHead>
                    <TableHead className="text-right">Tổng Tiền</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((item) => (
                    <TableRow key={item.orderCode}>
                      <TableCell className="font-mono font-medium">{item.orderCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.customerName}</p>
                          <p className="text-sm text-muted-foreground">{item.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.movieTitle}</TableCell>
                      <TableCell>
                        <div>
                          <p>{item.cinemaName}</p>
                          <p className="text-sm text-muted-foreground">{item.roomName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.showtime ? format(parseISO(item.showtime + ":00"), "dd/MM/yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.seats || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">
                          No Show ({item.noShowCount}/{item.ticketCount})
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Phân trang */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (pagination.hasPrev) setPage(page - 1) }}
                          className={!pagination.hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = page <= 3 ? i + 1 : page - 2 + i
                        if (pageNum < 1 || pageNum > pagination.totalPages) return null
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => { e.preventDefault(); setPage(pageNum) }}
                              isActive={pageNum === page}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {pagination.totalPages > 5 && page < pagination.totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (pagination.hasNext) setPage(page + 1) }}
                          className={!pagination.hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.totalItems)} trong tổng số {pagination.totalItems} vé
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}