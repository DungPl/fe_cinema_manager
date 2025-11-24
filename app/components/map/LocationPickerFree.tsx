// components/map/LocationPickerFree.tsx
import { useState, useEffect } from "react"
import { Loader2, MapPin } from "lucide-react"

function parseOSMAddress(addr: any) {
  return {
    house_number: addr.house_number || "",
    street: addr.road || addr.street || addr.pedestrian || "",
    ward: addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || "",
    district: addr.city_district || addr.district || addr.county || "",
    province: addr.city || addr.state || addr.province || addr.region || "",
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
    if (q.trim().length < 3) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q + ", Vietnam"
        )}&countrycodes=vn&limit=6&addressdetails=1&accept-language=vi`
      )
      const data = await res.json()
      setSuggestions(data)
    } catch (err) {
      console.error("Nominatim error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => searchAddress(query), 600)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (item: any) => {
    const parsed = parseOSMAddress(item.address || {})
    const result: LocationData = {
      house_number: parsed.house_number,
      street: parsed.street,
      ward: parsed.ward,
      district: parsed.district,
      province: parsed.province,
      fullAddress: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }

    setSelectedAddr(item.display_name)
    setQuery("")
    setSuggestions([])
    onLocationSelect(result)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="VD: Lotte Cinema Thăng Long, CGV Vincom Hà Nội..."
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
              <p className="font-medium text-sm">{s.display_name.split(",")[0]}</p>
              <p className="text-xs text-gray-500 truncate">
                {s.display_name.split(",").slice(1).join(",")}
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