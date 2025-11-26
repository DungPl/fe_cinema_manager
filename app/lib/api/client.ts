// ~/lib/api/client.ts
import { toast } from "sonner"

const API_BASE = "http://localhost:8002/api/v1"
const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
class ApiClient {
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value: any) => void
    reject: (reason?: any) => void
  }> = []

  // Hàm build URL + query params (bây giờ sẽ có ?page=8&limit=5)
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    if (!params) return `${API_BASE}${endpoint}`

    const url = new URL(`${API_BASE}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value))
      }
    })
    return url.toString()
  }

  private processQueue(error: any, tokenData?: any) {
    this.failedQueue.forEach((prom) => {
      error ? prom.reject(error) : prom.resolve(tokenData)
    })
    this.failedQueue = []
  }

  private logout() {
    if (isBrowser) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
      document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
      window.location.href = "/login"
    }
  }

  // Hàm request chính – có xử lý refresh token
  private async request<T>(
    endpoint: string,
    config: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)

    let response = await fetch(url, {
      ...config,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    })

    // ĐỌC BODY 1 LẦN DUY NHẤT → lưu vào biến
    let data: any
    try {
      data = await response.json()
    } catch {
      data = null // nếu không phải JSON
    }

    // XỬ LÝ REFRESH TOKEN
    // CHỈ REFRESH TOKEN KHI Ở BROWSER (có cookie)
    if (response.status === 401) {
      if (isBrowser) {
        // Chỉ thử refresh token khi có cookie (tức là đang ở browser)
        if (!this.isRefreshing) {
          this.isRefreshing = true
          try {
            const refreshResponse = await fetch(`${API_BASE}/auth/refresh-token`, {
              method: "POST",
              credentials: "include",
            })

            if (refreshResponse.ok) {
              // Retry request gốc
              response = await fetch(url, {
                ...config,
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  ...config.headers,
                },
              })
              data = await response.json()
              this.processQueue(null, data)
            } else {
              throw new Error("Refresh failed")
            }
          } catch {
            this.processQueue(new Error("Refresh failed"))
            this.logout()
            throw new Error("Unauthorized")
          } finally {
            this.isRefreshing = false
          }
        } else {
          // Đang refresh → chờ
          await new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject })
          })
          response = await fetch(url, { ...config, credentials: "include" })
          data = await response.json()
        }
      } else {
        // ĐANG CHẠY TRÊN SERVER (loader) → KHÔNG THỂ REFRESH → CHỈ NÉM LỖI
        throw new Response("Unauthorized", { status: 401 })
      }
    }

    // Dùng data đã đọc thay vì đọc lại response.json()
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || "Request failed"
      throw new Error(errorMessage)
    }

    // Nếu vẫn 401 sau refresh
    if (response.status === 401) {
      this.logout()
      throw new Error("Unauthorized")
    }

    return data as T
  }

  // GET – có query params
  get<T>(endpoint: string, params?: Record<string, any>) {
    return this.request<T>(endpoint, { method: "GET" }, params)
  }

  // POST
  post<T>(endpoint: string, data?: any) {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      undefined
    )
  }

  // PUT
  put<T>(endpoint: string, data?: any) {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      undefined
    )
  }

  // DELETE (có thể gửi body nếu cần)
  delete<T>(endpoint: string, data?: any) {
    return this.request<T>(
      endpoint,
      {
        method: "DELETE",
        body: data ? JSON.stringify(data) : undefined,
      },
      undefined
    )
  }

  // POST FormData (upload file)
  postForm<T>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: "POST", body: formData }, undefined)
  }

  // PUT FormData
  putForm<T>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: "PUT", body: formData }, undefined)
  }
}

export const apiClient = new ApiClient()