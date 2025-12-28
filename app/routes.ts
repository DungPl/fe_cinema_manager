// app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes"
export default [
  // Public
  {
    path: "/",
    file: "routes/public/layout.tsx",
    children: [
      { path: "", file: "routes/public/index.tsx" },
      {
        path: "rap/:slug",
        file: "routes/public/rap/[slug].tsx", // Thêm file mới cho trang chi tiết rạp
      },
      {
        path: "dat-ve/:code",
        file: "routes/public/dat-ve/[code].tsx", // Thêm file mới cho trang chi tiết rạp
      },
      {
        path: "phim/:slug",  // ← Thêm dòng này
        file: "routes/public/phim/[slug].tsx",  // ← Trỏ đến file phim chi tiết
      },
      {
        path: "payment/:code",  // ← Thêm dòng này
        file: "routes/public/payment/[code].tsx",  // ← Trỏ đến file phim chi tiết
      },
      {
        path: "search",
        file: "routes/public/search.tsx",
      },
      {
        path: "phim",
        file: "routes/public/phim.tsx",
      },
      {
        path: "login",
        file: "routes/public/login.tsx",
      },
      {
        path: "register",
        file: "routes/public/register.tsx"
      },
      {
        path: "dat-ve/thanh-cong/:orderCode",
        file: "routes/public/dat-ve/thanh-cong/[orderCode].tsx"
      },
      {
        path: "ve-cua-toi",
        file: "routes/public/ve-cua-toi.tsx"
      },
    ]
  },

  // Auth

  //{ path: "/register", file: "routes/authen/register.tsx" },
  { path: "/admin/login", file: "routes/admin/login.tsx" },
  // Admin
  {
    path: "/admin",
    file: "routes/admin/layout.tsx",
    children: [

      { path: "", file: "routes/admin/index.tsx" },

      {
        path: "cinema-chains",
        file: "routes/admin/cinema_chains/index.tsx",
      },
      {
        path: "cinemas",
        file: "routes/admin/cinemas/index.tsx",
      },
      {
        path: "cinemas/:cinemaId/rooms",
        file: "routes/admin/cinemas/[cinemaId]/rooms.tsx"
      },
      {
        path: "movie",
        file: "routes/admin/movie/index.tsx"
      },
      {
        path: "movie/actors",
        file: "routes/admin/movie/actors.tsx"
      },
      {
        path: "movie/directors",
        file: "routes/admin/movie/directors.tsx"
      },
      {
        path: "showtime",
        file: "routes/admin/showtime/index.tsx"
      },
    ],
  },
  {
    path: "/staff",
    file: "routes/admin/staff/layout.tsx", // Layout riêng cho staff nếu cần
    children: [
      { path: "create-ticket", file: "routes/admin/staff/create-ticket.tsx" },
      // { path: "check-in", file: "routes/admin/staff/check-in.tsx" },
    ],
  },
  // Manager
  // {
  //   path: "/manager",
  //   file: "routes/(manager)/index.tsx",
  //   children: [
  //     { path: "", file: "routes/(manager)/dashboard.tsx" },
  //     { path: "showtimes", file: "routes/(manager)/showtimes/index.tsx" },
  //   ],
  // },

  // Customer
  // {
  //   path: "/booking",
  //   file: "routes/(customer)/booking/movie/[id].tsx",
  // },

  // Error
  { path: "/forbidden", file: "routes/forbidden.tsx" },
  { path: "*", file: "routes/not-found.tsx" },
] satisfies RouteConfig