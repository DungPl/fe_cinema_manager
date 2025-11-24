// src/main.tsx   ← PHẢI ĐẶT Ở ĐÚNG src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes  from "~/routes"; // vite-plugin-pages tự sinh file này

import "~/styles/index.css"; // hoặc ./app/index.css
const router = createBrowserRouter(routes);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);