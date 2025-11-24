// components/cinema/LocationMapPreview.tsx
import { useEffect, useRef } from "react"

interface Props {
  lat: number
  lng: number
}

export function LocationMapPreview({ lat, lng }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const loadMap = async () => {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")

      // Fix icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Xóa map cũ nếu tồn tại (fix lỗi)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      if (!isMounted || !mapContainerRef.current) return

      // Tạo map mới
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)
      L.marker([lat, lng]).addTo(map).bindPopup("Vị trí").openPopup()

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
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}
