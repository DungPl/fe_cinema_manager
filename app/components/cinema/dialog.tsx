import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { LocationPickerFree } from "~/components/map/LocationPickerFree" // Component bạn đã tạo
import { LocationMapPreview } from "~/components/map/LocationMapPreview" // ← thêm dòng này
import type { Cinema, UpdateCinemaInput, CreateCinemaInput } from "~/lib/api/types"
interface AddressForm {
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
    open: boolean
    onClose: () => void
    onSubmit: (data: UpdateCinemaInput | CreateCinemaInput) => void
    initialData?: Cinema | null
    chains: { id: number; name: string }[]
}

export function CinemaDialog({ open, onClose, onSubmit, initialData, chains }: Props) {
    const [name, setName] = useState("")
    const [chainId, setChainId] = useState("")
    const [phone, setPhone] = useState("")
    const [tab, setTab] = useState<"info" | "address">("info")

    const [address, setAddress] = useState<AddressForm>({
        house_number: "",
        street: "",
        ward: "",
        district: "",
        province: "",
        fullAddress: "",
        latitude: 0,
        longitude: 0
    })

    // Load dữ liệu khi sửa
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "")
            setChainId(String(initialData.chainId || ""))
            setPhone(initialData.phone || "")
            const addr =
                (initialData as any).address?.[0] ||      // Backend mới trả "address"
                initialData.address?.[0] ||             // Hỗ trợ backend cũ
                {
                    house_number: "",
                    street: "",
                    ward: "",
                    district: "",
                    province: "",
                    fullAddress: "",
                    latitude: 0,
                    longitude: 0,
                }

            setAddress({
                house_number: addr.house_number || "",
                street: addr.street || "",
                ward: addr.ward || "",
                district: addr.district || "",
                province: addr.province || "",
                fullAddress: addr.fullAddress || "",
                latitude: Number(addr.latitude ?? 0),
                longitude: Number(addr.longitude ?? 0),
            })
        } else {
            // Reset khi thêm mới
            setName("")
            setChainId("")
            setPhone("")
            setAddress({
                house_number: "",
                street: "",
                ward: "",
                district: "",
                province: "",
                fullAddress: "",
                latitude: 0,
                longitude: 0
            })
        }
    }, [initialData, open])

    const handleSubmit = () => {
        const payload: UpdateCinemaInput | CreateCinemaInput = {
            name: name || undefined,
            chainId: Number(chainId),
            phone: phone || undefined,
            active: initialData?.isActive ?? true,
            // ← GỬI ĐÚNG THEO BACKEND
            address: address.latitude === 0 ? undefined : {
                house_number: address.house_number || undefined,
                street: address.street,
                ward: address.ward,
                district: address.district,
                province: address.province,
                fullAddress: address.fullAddress,
                latitude: address.latitude,
                longitude: address.longitude,
            }
        }

        onSubmit(payload)
    }
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {initialData ? "Chỉnh sửa rạp chiếu phim" : "Thêm rạp chiếu phim mới"}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? "Cập nhật thông tin và vị trí của rạp chiếu phim."
                            : "Nhập đầy đủ thông tin và chọn chính xác vị trí trên bản đồ."}
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b -mx-6">
                    <button
                        onClick={() => setTab("info")}
                        className={`px-8 py-3 font-medium transition-colors border-b-2 ${tab === "info"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Thông tin cơ bản
                    </button>
                    <button
                        onClick={() => setTab("address")}
                        className={`px-8 py-3 font-medium transition-colors border-b-2 ${tab === "address"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Địa chỉ & Bản đồ
                    </button>
                </div>

                {/* Nội dung tab */}
                <div className="flex-1 overflow-y-auto px-6 py-4 -mx-6">
                    {tab === "info" && (
                        <div className="space-y-5 max-w-2xl mx-auto">
                            <div>
                                <Label>Tên rạp chiếu phim</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Lotte Cinema Thăng Long" />
                            </div>
                            <div>
                                <Label>Thuộc chuỗi rạp</Label>
                                <select className="w-full px-3 py-2 border rounded-lg" value={chainId} onChange={(e) => setChainId(e.target.value)}>
                                    <option value="">Chọn chuỗi rạp</option>
                                    {chains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Số điện thoại (tùy chọn)</Label>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123456789" />
                            </div>

                        </div>
                    )}

                    {tab === "address" && (
                        <div className="space-y-6">
                            <LocationPickerFree onLocationSelect={setAddress} />

                            {address.latitude !== 0 && (
                                <>
                                    <div className="p-4 bg-blue-50 rounded-lg border">
                                        <p className="font-medium text-blue-900">Địa chỉ đã chọn:</p>
                                        <p className="text-sm text-blue-800 mt-1">{address.fullAddress}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-3">Xem trước trên bản đồ:</p>
                                        <LocationMapPreview lat={address.latitude} lng={address.longitude} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Nút cố định dưới cùng */}
                <div className="flex justify-end gap-3 pt-4 border-t -mx-6 px-6 bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Hủy</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name || !chainId || address.latitude === 0}
                    >
                        {initialData ? "Cập nhật" : "Tạo rạp mới"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
