// ~/lib/api/client.ts
import { toast } from "sonner"
import { useAuthStore } from "~/stores/authAccountStore";

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
  if (!isBrowser) return

  toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")

  localStorage.clear()

  window.dispatchEvent(new Event("auth:logout"))

  const currentRole = useAuthStore.getState().account?.role
  const redirectUrl = currentRole === "ADMIN" || currentRole === "MANAGER" || currentRole === "MODERATOR"
    ? "/admin/login"
    : "/login"

  window.location.assign(redirectUrl)
}



  // Hàm request chính – có xử lý refresh token
  private async request<T>(
    endpoint: string,
    config: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)

    const headers = new Headers(config.headers)

    if (!(config.body instanceof FormData)) {
      headers.set("Content-Type", "application/json")
    }

    // TỰ ĐỘNG THÊM TOKEN VÀO HEADER
    const token = localStorage.getItem("accessToken")
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    let response = await fetch(url, {
      ...config,
      credentials: "include",
      headers,
    })

    let data: any
    try {
      data = await response.json()
    } catch {
      data = null
    }

    // Xử lý refresh token khi 401
    if (response.status === 401 && isBrowser) {
      if (!this.isRefreshing) {
        this.isRefreshing = true
        try {
          const isAdmin = window.location.pathname.startsWith("/admin")
          const refreshEndpoint = isAdmin 
            ? "/auth/refresh-token" 
            : "/khach-hang/refresh-token"

          const refreshResponse = await fetch(`${API_BASE}${refreshEndpoint}`, {
            method: "POST",
            credentials: "include",
          })

          if (refreshResponse.ok) {
            const retryHeaders = new Headers(config.headers)
            if (!(config.body instanceof FormData)) {
              retryHeaders.set("Content-Type", "application/json")
            }

            response = await fetch(url, {
              ...config,
              credentials: "include",
              headers: retryHeaders,
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
        await new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject })
        })
        response = await fetch(url, { ...config, credentials: "include" })
        data = await response.json()
      }
    }

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data,
        },
      }
    }

    return data as T
  }

  // GET – có query params
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
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
  patch<T>(endpoint: string, data?: any) {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
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