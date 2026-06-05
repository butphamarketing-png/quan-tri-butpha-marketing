import { useState } from "react";
import { useListReceipts, useCreateReceipt, useUpdateReceipt, useDeleteReceipt, useListCustomers, useListContracts, useListServices } from "@workspace/api-client-react";
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
import { getListReceiptsQueryKey } from "@workspace/api-client-react";

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "card", label: "Thẻ" },
  { value: "other", label: "Khác" },
];

const STATUSES = [
  { value: "draft", label: "Nháp" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" },
];

interface FormData {
  customerId: string;
  contractId: string;
  serviceId: string;
  receiptDate: string;
  amount: string;
  paymentMethod: string;
  description: string;
  status: string;
}

const emptyForm: FormData = { customerId: "", contractId: "", serviceId: "", receiptDate: new Date().toISOString().split("T")[0], amount: "", paymentMethod: "bank_transfer", description: "", status: "confirmed" };

export default function Receipts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, isLoading } = useListReceipts({ search: search || undefined, page, limit: 20 });
  const { data: customers } = useListCustomers({ limit: 100 });
  const { data: contracts } = useListContracts({ limit: 100 });
  const { data: services } = useListServices({ limit: 100 });
  const createMutation = useCreateReceipt();
  const updateMutation = useUpdateReceipt();
  const deleteMutation = useDeleteReceipt();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListReceiptsQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerId: Number(form.customerId),
      contractId: form.contractId ? Number(form.contractId) : undefined,
      serviceId: form.serviceId ? Number(form.serviceId) : undefined,
      receiptDate: form.receiptDate,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      description: form.description,
      status: form.status,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, data: payload });
        toast({ title: "Cập nhật thành công" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Tạo phiếu thu thành công" });
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
      customerId: String(row.customerId ?? ""),
      contractId: String(row.contractId ?? ""),
      serviceId: String(row.serviceId ?? ""),
      receiptDate: String(row.receiptDate ?? ""),
      amount: String(row.amount ?? ""),
      paymentMethod: String(row.paymentMethod ?? "bank_transfer"),
      description: String(row.description ?? ""),
      status: String(row.status ?? "confirmed"),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa phiếu thu này?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Đã xóa phiếu thu" });
      await invalidate();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];
  const columns = [
    { key: "code", header: "Mã PT" },
    { key: "receiptDate", header: "Ngày Thu", render: (r: Record<string, unknown>) => formatDate(r.receiptDate as string) },
    { key: "customerName", header: "Khách Hàng" },
    { key: "serviceName", header: "Dịch Vụ" },
    { key: "amount", header: "Số Tiền", render: (r: Record<string, unknown>) => <span className="text-green-600 font-semibold">{formatVND(r.amount as number)}</span> },
    { key: "paymentMethod", header: "Phương Thức", render: (r: Record<string, unknown>) => PAYMENT_METHODS.find(m => m.value === r.paymentMethod)?.label ?? String(r.paymentMethod ?? "") },
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
      <PageHeader title="Phiếu Thu" subtitle="Quản lý các khoản thu từ khách hàng" action={{ label: "Tạo Phiếu Thu", onClick: () => { setEditing(null); setForm(emptyForm); setShowForm(true); } }} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm mã phiếu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Chưa có phiếu thu nào" />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Cập Nhật Phiếu Thu" : "Tạo Phiếu Thu Mới"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Khách Hàng *</Label>
                <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                  <SelectContent>{(customers?.data ?? []).map((c: any) => <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.name)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Hợp Đồng</Label>
                <Select value={form.contractId} onValueChange={v => setForm({ ...form, contractId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn hợp đồng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có</SelectItem>
                    {(contracts?.data ?? []).filter((c: any) => !form.customerId || String(c.customerId) === form.customerId).map((c: any) => <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.code)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Dịch Vụ</Label>
                <Select value={form.serviceId} onValueChange={v => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không có</SelectItem>
                    {(services?.data ?? []).map((s: any) => <SelectItem key={String(s.id)} value={String(s.id)}>{String(s.name)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ngày Thu *</Label>
                <Input type="date" value={form.receiptDate} onChange={e => setForm({ ...form, receiptDate: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Số Tiền (VNĐ) *</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min={0} />
              </div>
              <div className="space-y-1">
                <Label>Phương Thức</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
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
                <Input placeholder="Mô tả giao dịch..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? "Cập Nhật" : "Tạo Phiếu Thu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
