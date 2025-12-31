// components/map/LocationPickerFree.tsx
import { useState, useEffect } from "react"
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

function normalizeVNAddress(input: string) {
  return input
    .replace(/\b(tầng|lầu|floor)\s*\d+(\s*&\s*\d+)?/gi, "")
    .replace(/\b(toà nhà|tòa nhà|building)\s*[^\d,]+/gi, "")
    .replace(/&/g, " ")
    .replace(/\bĐ\.\s*/gi, "Đường ")
    .replace(/\bP\.\s*/gi, "Phường ")
    .replace(/\bQ\.\s*/gi, "Quận ")
    .replace(/\bTP\.\s*/gi, "Hồ Chí Minh")
    .replace(/\s+/g, " ")
    .trim()
}

function parseVietmapAddress(item: any) {
  const boundaries = item.boundaries || []

  const wardObj = boundaries.find((b: any) => b.type === 2)
  const districtObj = boundaries.find((b: any) => b.type === 1)
  const provinceObj = boundaries.find((b: any) => b.type === 0)

  return {
    house_number: item.name?.split(" ")[0] || "",
    street: item.name || "",
    ward: wardObj ? wardObj.full_name || wardObj.name || "" : "",
    district: districtObj ? districtObj.full_name || districtObj.name || "" : "",
    province: provinceObj ? provinceObj.full_name || provinceObj.name || "" : "",
  }
}

interface LocationData {
  house_number: string
  street: string
  ward: string
  district: string
  province: string
  fullAddress: string
  latitude: number
  longitude: number
}

interface Props {
  onLocationSelect: (data: LocationData) => void
}

export function LocationPickerFree({ onLocationSelect }: Props) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedAddr, setSelectedAddr] = useState("")
  const [loading, setLoading] = useState(false)

  const searchAddress = async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      return
    }

    let normalized = normalizeVNAddress(q)

    // Loại bỏ phần lặp tỉnh/thành phố thừa ở cuối
    normalized = normalized.replace(/([,\s]+Hồ Chí Minh)+$/i, ", Hồ Chí Minh")
    normalized = normalized.replace(/([,\s]+Thành phố Hồ Chí Minh)+$/i, "")

    // Nếu query quá dài, ưu tiên phần đầu (số nhà + đường + phường/quận)
    if (normalized.length > 100) {
      const parts = normalized.split(",")
      normalized = parts.slice(0, 3).join(",").trim()
    }

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8002/api/vietmap/autocomplete?text=${encodeURIComponent(normalized)}`
      )

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      // Debug tạm thời – có thể xóa sau khi ổn định
      console.log("Vietmap v3 response:", data)

      setSuggestions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Vietmap proxy error:", err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => searchAddress(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = async (item: any) => {
    const parsed = parseVietmapAddress(item)

    let fullAddr = item.display?.trim() ||
      [item.name?.trim(), item.address?.trim()].filter(Boolean).join(", ").replace(/,\s*$/, "")

    // Nếu có ref_id → gọi API place để lấy tọa độ chính xác
    if (item.ref_id) {
      try {
        const res = await fetch(`http://localhost:8002/api/vietmap/place?refid=${item.ref_id}`)
        if (res.ok) {
          const placeData = await res.json()
          const latitude = Number(placeData.lat)
          const longitude = Number(placeData.lng)

          if (!isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
            const result: LocationData = {
              ...parsed,
              fullAddress: placeData.display || fullAddr,
              latitude,
              longitude,
            }

            setSelectedAddr(result.fullAddress)
            setQuery("")
            setSuggestions([])
            onLocationSelect(result)
            return
          }
        }
      } catch (err) {
        console.warn("Lỗi lấy tọa độ từ Place API:", err)
      }
    }

    // Fallback nếu không có ref_id hoặc lỗi → thông báo không chọn được
    toast.error("Địa chỉ này chưa có tọa độ chính xác. Vui lòng chọn địa chỉ khác hoặc thử lại.")
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ số nhà + tên đường, ví dụ: 62 Trần Quang Khải, Lotte Landmark..."
          className="w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
        {loading && <Loader2 className="absolute right-3 top-4 animate-spin text-blue-600 w-5 h-5" />}
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {s.display || s.address || "Việt Nam"}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedAddr && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">Đã chọn địa chỉ:</p>
          <p className="text-sm text-green-700 mt-1">{selectedAddr}</p>
        </div>
      )}
    </div>
  )
}