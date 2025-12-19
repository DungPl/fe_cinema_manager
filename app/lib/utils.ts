import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const toBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value === "true" || value === "1"
  if (typeof value === "number") return value === 1
  return false
}
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num)
}
export const handleApiResponse = <T>(res: any): T => {
  const payload = res.data?.data || res.data || res
  return payload
}
export function getGuestSessionId() {
  let id = localStorage.getItem("guestSessionId")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("guestSessionId", id)
  }
  return id
}