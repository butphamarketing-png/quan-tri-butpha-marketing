import { useState } from "react";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@workspace/api-client-react";
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
import { toast } from "@/hooks/use-toast";
import { getListCustomersQueryKey } from "@workspace/api-client-react";

interface FormData { name: string; email: string; phone: string; address: string; taxCode: string; contactPerson: string; status: string; notes: string }
const emptyForm: FormData = { name: "", email: "", phone: "", address: "", taxCode: "", contactPerson: "", status: "active", notes: "" };

export default function Customers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useListCustomers({ search: search || undefined, page, limit: 20 });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, data: form });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data: form });
        toast({ title: "Tạo khách hàng thành công" });
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); await invalidate();
    } catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row.id as number);
    setForm({ name: String(row.name ?? ""), email: String(row.email ?? ""), phone: String(row.phone ?? ""), address: String(row.address ?? ""), taxCode: String(row.taxCode ?? ""), contactPerson: String(row.contactPerson ?? ""), status: String(row.status ?? "active"), notes: String(row.notes ?? "") });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa khách hàng này?")) return;
    try { await deleteMutation.mutateAsync({ id }); toast({ title: "Đã xóa" }); await invalidate(); }
    catch { toast({ title: "Có lỗi xảy ra", variant: "destructive" }); }
  };

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];
  const columns = [
    { key: "name", header: "Tên Khách Hàng" },
    { key: "phone", header: "Điện Thoại" },
    { key: "email", header: "Email" },
    { key: "contactPerson", header: "Người Liên Hệ" },
    { key: "taxCode", header: "MST", render: (r: Record<string, unknown>) => (r.taxCode as string) || "—" },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
    { key: "actions", header: "", render: (r: Record<string, unknown>) => (<div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id as number)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></div>) },
  ];

  return (
    <div>
      <PageHeader title="Khách Hàng" subtitle="Quản lý danh sách khách hàng" action={{ label: "Thêm Khách Hàng", onClick: () => { setEditing(null); setForm(emptyForm); setShowForm(true); } }} />
      <div className="flex gap-3 mb-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Chưa có khách hàng" />
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><Label>Tên Khách Hàng *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Điện Thoại</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Người Liên Hệ</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="space-y-1"><Label>Mã Số Thuế</Label><Input value={form.taxCode} onChange={e => setForm({ ...form, taxCode: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Địa Chỉ</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-1"><Label>Trạng Thái</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="inactive">Ngừng HĐ</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Ghi Chú</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button><Button type="submit">{editing ? "Cập Nhật" : "Thêm Mới"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
