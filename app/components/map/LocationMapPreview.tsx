// components/map/LocationMapPreview.tsx
import { useEffect, useRef } from "react"

interface Props {
  lat: number
  lng: number
}

export function LocationMapPreview({ lat, lng }: Props) {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
    return (
      <div className="h-96 w-full rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chưa có tọa độ hợp lệ để hiển thị bản đồ</p>
      </div>
    )
  }
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const loadMap = async () => {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")

      // Fix Leaflet icon mặc định
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Xóa map cũ nếu có
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      if (!isMounted || !mapContainerRef.current) return

      // Tạo map mới
      const map = L.map(mapContainerRef.current).setView([lat, lng], 16)

      // Dùng tile Vietmap chính thức (đẹp, cập nhật, chuẩn Việt Nam)
      L.tileLayer("https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=78ba899cd30afdb47c8d84bbfdce81e60722cffae4918b4c", {
        attribution: '&copy; Vietmap',
        maxZoom: 19,
      }).addTo(map)

      // Marker với popup đẹp
      const marker = L.marker([lat, lng]).addTo(map)
      marker.bindPopup("<b>Vị trí rạp chiếu phim</b>").openPopup()

      // Tùy chọn: Thêm vòng tròn nhỏ để đánh dấu chính xác
      L.circle([lat, lng], {
        radius: 50,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(map)

      mapRef.current = map
    }

    loadMap()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng])

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-200 shadow-md">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}