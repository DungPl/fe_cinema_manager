// lib/api/authApi.ts
import { apiClient } from "./client"

interface ApiResponse<T> {
  status: string;
  data: T;
}
interface RegisterInput {
  username: string
  email: string
  phone: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

// lib/api/authApi.ts
interface ApiError {
  status: string
  message: string
  keyError?: string
  errors?: string
}

export const registerCustomer = async (data: RegisterInput): Promise<void> => {
  try {
    await apiClient.post("/khach-hang/register", data)
  } catch (error: any) {
    // Throw nguyên object error để frontend lấy được response.data
    if (error.response?.data) {
      const apiError = error.response.data as ApiError
      const err = new Error(apiError.message || "Đăng ký thất bại")
      // Gắn thêm keyError vào error object
      Object.assign(err, {
        keyError: apiError.keyError,
        status: apiError.status,
        errors: apiError.errors,
      })
      throw err
    }

    // Lỗi khác (network, server)
    throw new Error("Có lỗi xảy ra. Vui lòng thử lại sau.")
  }
}


export const loginCustomer = async (data: LoginInput): Promise<LoginResponse> => {
  try {
    const res = await apiClient.post<ApiResponse<LoginResponse>>("/khach-hang/login", data)
    return res.data! // Giả sử backend trả { accessToken, refreshToken, user }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Đăng nhập thất bại")
  }
}