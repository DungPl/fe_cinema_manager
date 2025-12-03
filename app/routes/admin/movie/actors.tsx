// src/app/routes/(admin)/movies/actors/index.tsx
import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast, Toaster } from "sonner";
import { ActorDialog } from "~/components/actor/dialog";
import { BatchActorDialog } from "~/components/actor/create-bulk"
import { getActor, createActor, updateActor, deleteActors, createActors } from "~/lib/api/actorApi";
import { Skeleton } from "~/components/ui/skeleton";
import { useDebounce } from "use-debounce";
import type { Actor } from "~/lib/api/types";

export default function ActorsPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Actor | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
 const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState("")
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / limit);

  // Load actors client-side
  const loadActors = async () => {
    setLoading(true);
    try {
      const params = { page, limit, search };
      const response = await getActor(params); // getActor cần hỗ trợ params {page, limit, search}
      setActors(response.rows);
      setTotalCount(response.totalCount || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải dữ liệu diễn viên");
    } finally {
      setLoading(false);
    }
  };
  const handleBatchSave = async (names: string[]) => {
    try {
      await createActors(names);
      toast.success(`Đã tạo ${names.length} diễn viên thành công`);
      setBatchDialogOpen(false);
      loadActors();
    } catch (err: any) {
      toast.error(err.message || "Tạo hàng loạt thất bại");
    }
  };
  useEffect(() => {
    loadActors();
  }, [page, debouncedSearch]);

  // Save (create/update)
  const handleSave = async (form: any) => {
    try {
      if (editing) {
        await updateActor(editing.id, form);
        toast.success("Cập nhật thành công");
      } else {
        await createActor(form);
        toast.success("Thêm diễn viên thành công");
      }
      setDialogOpen(false);
      setEditing(null);
      loadActors();
    } catch (err: any) {
      toast.error(err.message || "Lưu thất bại");
    }
  };

  // Delete selected
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Xóa ${selectedIds.length} diễn viên?`)) return;

    try {
      await deleteActors(selectedIds);
      toast.success("Xóa thành công");
      setSelectedIds([]);
      setSelectAll(false);
      loadActors();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  // Toggle select 1 row
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all
  useEffect(() => {
    if (selectAll) {
      setSelectedIds(actors.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  }, [selectAll, actors]);

  return (
    <>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Diễn Viên</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý thông tin diễn viên</p>
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm diễn viên
          </Button>
          <Button variant="outline" onClick={() => setBatchDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tạo hàng loạt
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-10"
          />
        </div>

        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Hiển thị <strong>{actors.length}</strong> diễn viên
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3">Avatar</th>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Tiểu sử</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {actors.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      {a.avatar ? (
                        <img
                          src={a.avatar}
                          alt={a.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                          No avatar
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>

                    <td className="px-6 py-4 text-gray-600 break-words">{a.biography || "-"}</td>

                    <td className="px-6 py-4 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditing(a); setDialogOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {actors.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Không tìm thấy diễn viên nào.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog */}
      <ActorDialog
        isOpen={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={handleSave}
        initialData={editing ?? undefined}
      />
      <BatchActorDialog
        isOpen={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        onSave={handleBatchSave}
      />
    </>
  );
}

// Skeleton
function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}
