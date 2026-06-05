import { useState } from "react";
import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Search } from "lucide-react";
import { formatVND } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { getListServicesQueryKey } from "@workspace/api-client-react";

const SERVICE_TYPES = [
  { value: "digital", label: "Kỹ thuật số" },
  { value: "creative", label: "Sáng tạo" },
  { value: "consulting", label: "Tư vấn" },
  { value: "event", label: "Sự kiện" },
  { value: "printing", label: "In ấn" },
  { value: "other", label: "Khác" },
];

interface FormData { name: string; type: string; description: string; unitPrice: string; unit: string; status: string }
const emptyForm: FormData = { name: "", type: "digital", description: "", unitPrice: "", unit: "tháng", status: "active" };

export default function Services() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useListServices({ search: search || undefined, page, limit: 20 });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined };
    try {
      if (editing) { await updateMutation.mutateAsync({ id: editing, data: payload }); toast({ title: "Cập nhật thành công" }); }
      else { await createMutation.mutateAsync({ data: payload }); toast({ title: "Thêm dịch vụ thành công" }); }
      setShowForm(false); setEditing(null); setForm(emptyForm); await invalidate();
    } catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row.id as number);
    setForm({ name: String(row.name ?? ""), type: String(row.type ?? "digital"), description: String(row.description ?? ""), unitPrice: String(row.unitPrice ?? ""), unit: String(row.unit ?? "tháng"), status: String(row.status ?? "active") });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa dịch vụ này?")) return;
    try { await deleteMutation.mutateAsync({ id }); toast({ title: "Đã xóa" }); await invalidate(); }
    catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];
  const columns = [
    { key: "name", header: "Tên Dịch Vụ" },
    { key: "type", header: "Loại", render: (r: Record<string, unknown>) => <StatusBadge status={r.type as string} /> },
    { key: "unitPrice", header: "Đơn Giá", render: (r: Record<string, unknown>) => formatVND(r.unitPrice as number) },
    { key: "unit", header: "Đơn Vị" },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
    { key: "description", header: "Mô Tả", className: "max-w-xs truncate" },
    { key: "actions", header: "", render: (r: Record<string, unknown>) => (<div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id as number)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="Dịch Vụ" subtitle="Quản lý danh mục dịch vụ" action={{ label: "Thêm Dịch Vụ", onClick: () => { setEditing(null); setForm(emptyForm); setShowForm(true); } }} />
      <div className="flex gap-3 mb-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Chưa có dịch vụ" />
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Cập Nhật Dịch Vụ" : "Thêm Dịch Vụ"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><Label>Tên Dịch Vụ *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Loại</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Trạng Thái</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="inactive">Ngừng HĐ</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Đơn Giá (VNĐ)</Label><Input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} /></div>
              <div className="space-y-1"><Label>Đơn Vị</Label><Input placeholder="tháng / dự án..." value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Mô Tả</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button><Button type="submit">{editing ? "Cập Nhật" : "Thêm Mới"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
