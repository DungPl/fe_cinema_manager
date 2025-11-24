// app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes"

export default [
  // Public
  { path: "/", file: "routes/public/index.tsx" },

  // Auth
  { path: "/login", file: "routes/authen/login.tsx" },
  //{ path: "/register", file: "routes/authen/register.tsx" },

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