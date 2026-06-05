import { useState } from "react";
import { useListExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useListSuppliers, useListServices } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatVND, formatDate } from "@/lib/format";
import { Pencil, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getListExpensesQueryKey } from "@workspace/api-client-react";

const CATEGORIES = [
  { value: "salary", label: "Nhân sự" },
  { value: "media", label: "Truyền thông" },
  { value: "office", label: "Văn phòng" },
  { value: "software", label: "Phần mềm" },
  { value: "travel", label: "Di chuyển" },
  { value: "other", label: "Khác" },
];

const STATUSES = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
];

interface FormData {
  supplierId: string;
  serviceId: string;
  expenseDate: string;
  amount: string;
  category: string;
  description: string;
  status: string;
}

const emptyForm: FormData = { supplierId: "", serviceId: "", expenseDate: new Date().toISOString().split("T")[0], amount: "", category: "other", description: "", status: "paid" };

export default function Expenses() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useListExpenses({ search: search || undefined, page, limit: 20 });
  const { data: suppliers } = useListSuppliers({ limit: 100 });
  const { data: services } = useListServices({ limit: 100 });
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      serviceId: form.serviceId ? Number(form.serviceId) : undefined,
      expenseDate: form.expenseDate,
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      status: form.status,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, data: payload });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Tạo phiếu chi thành công" });
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row.id as number);
    setForm({
      supplierId: String(row.supplierId ?? ""),
      serviceId: String(row.serviceId ?? ""),
      expenseDate: String(row.expenseDate ?? ""),
      amount: String(row.amount ?? ""),
      category: String(row.category ?? "other"),
      description: String(row.description ?? ""),
      status: String(row.status ?? "paid"),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa phiếu chi này?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Đã xóa phiếu chi" });
      await invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const rows = (data?.data ?? []) as Record<string, unknown>[];
  const columns = [
    { key: "code", header: "Mã PC" },
    { key: "expenseDate", header: "Ngày Chi", render: (r: Record<string, unknown>) => formatDate(r.expenseDate as string) },
    { key: "supplierName", header: "Nhà Cung Cấp", render: (r: Record<string, unknown>) => (r.supplierName as string) || "—" },
    { key: "serviceName", header: "Dịch Vụ", render: (r: Record<string, unknown>) => (r.serviceName as string) || "—" },
    { key: "category", header: "Loại", render: (r: Record<string, unknown>) => <StatusBadge status={r.category as string} /> },
    { key: "amount", header: "Số Tiền", render: (r: Record<string, unknown>) => <span className="text-red-600 font-semibold">{formatVND(r.amount as number)}</span> },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
    { key: "description", header: "Mô Tả", className: "max-w-xs truncate" },
    {
      key: "actions", header: "", render: (r: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id as number)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Phiếu Chi" subtitle="Quản lý các khoản chi phí" action={{ label: "Tạo Phiếu Chi", onClick: () => { setEditing(null); setForm(emptyForm); setShowForm(true); } }} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm mã phiếu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Chưa có phiếu chi nào" />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Cập Nhật Phiếu Chi" : "Tạo Phiếu Chi Mới"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nhà Cung Cấp</Label>
                <Select value={form.supplierId} onValueChange={v => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn NCC" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có</SelectItem>
                    {(suppliers?.data ?? []).map((s: Record<string, unknown>) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Dịch Vụ</Label>
                <Select value={form.serviceId} onValueChange={v => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có</SelectItem>
                    {(services?.data ?? []).map((s: Record<string, unknown>) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ngày Chi *</Label>
                <Input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Số Tiền (VNĐ) *</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min={0} />
              </div>
              <div className="space-y-1">
                <Label>Loại Chi Phí</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Trạng Thái</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Mô Tả</Label>
                <Input placeholder="Mô tả chi phí..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Cập Nhật" : "Tạo Phiếu Chi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
