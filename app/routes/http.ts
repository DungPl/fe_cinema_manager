// app/api/http.ts
import axios from "axios"

// URL backend golang
export const http = axios.create({
  baseURL: "http://localhost:8080/api", // sau này bạn đổi PORT hoặc domain ở đây
  headers: {
    "Content-Type": "application/json"
  }
})
