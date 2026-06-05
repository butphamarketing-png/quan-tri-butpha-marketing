import { useState } from "react";
import { useListContracts, useCreateContract, useUpdateContract, useDeleteContract, useListCustomers, useListServices } from "@workspace/api-client-react";
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
import { formatVND, formatDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { getListContractsQueryKey } from "@workspace/api-client-react";

interface FormData { customerId: string; serviceId: string; code: string; title: string; totalValue: string; startDate: string; dueDate: string; status: string; notes: string }
const emptyForm: FormData = { customerId: "", serviceId: "", code: "", title: "", totalValue: "", startDate: new Date().toISOString().split("T")[0], dueDate: "", status: "draft", notes: "" };

export default function Contracts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useListContracts({ search: search || undefined, page, limit: 20 });
  const { data: customers } = useListCustomers({ limit: 100 });
  const { data: services } = useListServices({ limit: 100 });
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const deleteMutation = useDeleteContract();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListContractsQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { customerId: Number(form.customerId), serviceId: form.serviceId ? Number(form.serviceId) : undefined, code: form.code, title: form.title, totalValue: Number(form.totalValue), startDate: form.startDate, dueDate: form.dueDate || undefined, status: form.status, notes: form.notes || undefined };
    try {
      if (editing) { await updateMutation.mutateAsync({ id: editing, data: payload }); toast({ title: "Cập nhật thành công" }); }
      else { await createMutation.mutateAsync({ data: payload }); toast({ title: "Tạo hợp đồng thành công" }); }
      setShowForm(false); setEditing(null); setForm(emptyForm); await invalidate();
    } catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row.id as number);
    setForm({ customerId: String(row.customerId ?? ""), serviceId: String(row.serviceId ?? ""), code: String(row.code ?? ""), title: String(row.title ?? ""), totalValue: String(row.totalValue ?? ""), startDate: String(row.startDate ?? ""), dueDate: String(row.dueDate ?? ""), status: String(row.status ?? "draft"), notes: String(row.notes ?? "") });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa hợp đồng này?")) return;
    try { await deleteMutation.mutateAsync({ id }); toast({ title: "Đã xóa" }); await invalidate(); }
    catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];
  const columns = [
    { key: "code", header: "Mã HĐ" },
    { key: "title", header: "Tên Hợp Đồng" },
    { key: "customerName", header: "Khách Hàng" },
    { key: "totalValue", header: "Giá Trị", render: (r: Record<string, unknown>) => formatVND(r.totalValue as number) },
    { key: "paidAmount", header: "Đã Thu", render: (r: Record<string, unknown>) => <span className="text-green-600">{formatVND(r.paidAmount as number)}</span> },
    { key: "remainingAmount", header: "Còn Lại", render: (r: Record<string, unknown>) => <span className="text-orange-600">{formatVND(r.remainingAmount as number)}</span> },
    { key: "dueDate", header: "Hạn HĐ", render: (r: Record<string, unknown>) => formatDate(r.dueDate as string) },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
    { key: "actions", header: "", render: (r: Record<string, unknown>) => (<div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id as number)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="Hợp Đồng" subtitle="Quản lý hợp đồng với khách hàng" action={{ label: "Tạo Hợp Đồng", onClick: () => { setEditing(null); setForm(emptyForm); setShowForm(true); } }} />
      <div className="flex gap-3 mb-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm kiếm mã HĐ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Chưa có hợp đồng" />
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Cập Nhật Hợp Đồng" : "Tạo Hợp Đồng Mới"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Mã Hợp Đồng *</Label><Input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="HD-2026-XXX" /></div>
              <div className="space-y-1"><Label>Trạng Thái</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Nháp</SelectItem><SelectItem value="active">Hiệu lực</SelectItem><SelectItem value="completed">Hoàn thành</SelectItem><SelectItem value="cancelled">Đã hủy</SelectItem></SelectContent></Select></div>
              <div className="col-span-2 space-y-1"><Label>Tên Hợp Đồng *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Khách Hàng *</Label><Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })}><SelectTrigger><SelectValue placeholder="Chọn KH" /></SelectTrigger><SelectContent>{(customers?.data ?? []).map((c: any) => <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Dịch Vụ</Label><Select value={form.serviceId} onValueChange={v => setForm({ ...form, serviceId: v })}><SelectTrigger><SelectValue placeholder="Chọn DV" /></SelectTrigger><SelectContent><SelectItem value="">Không có</SelectItem>{(services?.data ?? []).map((s: any) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Giá Trị HĐ (VNĐ) *</Label><Input type="number" required value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })} /></div>
              <div className="space-y-1"><Label>Ngày Bắt Đầu</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Ngày Kết Thúc / Hạn</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button><Button type="submit">{editing ? "Cập Nhật" : "Tạo Hợp Đồng"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
