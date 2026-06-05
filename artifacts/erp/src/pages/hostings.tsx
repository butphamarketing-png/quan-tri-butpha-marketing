import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListHostings, getListHostingsQueryKey, createHosting, updateHosting, deleteHosting } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Bắt buộc"),
  hostingName: z.string().min(1, "Bắt buộc"),
  provider: z.string().min(1, "Bắt buộc"),
  package: z.string().min(1, "Bắt buộc"),
  capacity: z.string().optional(),
  registerDate: z.string().min(1, "Bắt buộc"),
  expireDate: z.string().min(1, "Bắt buộc"),
  buyPrice: z.coerce.number().optional(),
  sellPrice: z.coerce.number().optional(),
  status: z.string().default("active"),
  note: z.string().optional(),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Hoạt động", variant: "default" },
  expired: { label: "Hết hạn", variant: "destructive" },
  suspended: { label: "Tạm dừng", variant: "secondary" },
};
const fmtMoney = (v?: number | null) => v ? v.toLocaleString("vi-VN") + "₫" : "-";

export default function Hostings() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListHostings({ search: search || undefined });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListHostingsQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active" } });
  const createMut = useMutation({ mutationFn: (d: FV) => createHosting(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm hosting" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateHosting(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteHosting(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active" }); setEditing(null); setOpen(true); };
  const openEdit = (h: any) => {
    form.reset({ customerId: h.customerId, hostingName: h.hostingName, provider: h.provider, package: h.package, capacity: h.capacity ?? "", registerDate: h.registerDate, expireDate: h.expireDate, buyPrice: h.buyPrice, sellPrice: h.sellPrice, status: h.status, note: h.note ?? "" });
    setEditing({ id: h.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Quản Lý Hosting">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm hosting..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm hosting</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên Hosting</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Nhà CC</TableHead>
              <TableHead>Gói</TableHead>
              <TableHead>Hết Hạn</TableHead>
              <TableHead className="text-center">Còn</TableHead>
              <TableHead className="text-right">Giá Bán</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((h: any) => {
              const st = statusMap[h.status] || { label: h.status, variant: "secondary" as const };
              const warn = h.daysUntilExpiry <= 30;
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.hostingName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.customerName || "-"}</TableCell>
                  <TableCell className="text-sm">{h.provider}</TableCell>
                  <TableCell className="text-sm">{h.package}{h.capacity ? ` (${h.capacity})` : ""}</TableCell>
                  <TableCell className="text-sm">{h.expireDate}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold flex items-center justify-center gap-1 ${warn ? "text-destructive" : "text-green-600"}`}>
                      {warn && <AlertTriangle className="h-3 w-3" />}{h.daysUntilExpiry}d
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(h.sellPrice)}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa hosting này?")) deleteMut.mutate(h.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa hosting" : "Thêm hosting"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="hostingName" render={({ field }) => (<FormItem><FormLabel>Tên hosting *</FormLabel><FormControl><Input placeholder="Hosting khách A" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="provider" render={({ field }) => (<FormItem><FormLabel>Nhà cung cấp *</FormLabel><FormControl><Input placeholder="Matbao, AWS..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="package" render={({ field }) => (<FormItem><FormLabel>Gói *</FormLabel><FormControl><Input placeholder="Basic, Pro..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="capacity" render={({ field }) => (<FormItem><FormLabel>Dung lượng</FormLabel><FormControl><Input placeholder="10GB, 50GB..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="expired">Hết hạn</SelectItem><SelectItem value="suspended">Tạm dừng</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="registerDate" render={({ field }) => (<FormItem><FormLabel>Ngày đăng ký *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="expireDate" render={({ field }) => (<FormItem><FormLabel>Ngày hết hạn *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="buyPrice" render={({ field }) => (<FormItem><FormLabel>Giá mua (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellPrice" render={({ field }) => (<FormItem><FormLabel>Giá bán (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
