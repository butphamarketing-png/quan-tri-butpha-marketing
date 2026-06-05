import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListDomains, getListDomainsQueryKey, createDomain, updateDomain, deleteDomain } from "@workspace/api-client-react";
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
  domainName: z.string().min(1, "Bắt buộc"),
  provider: z.string().min(1, "Bắt buộc"),
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
  transferred: { label: "Chuyển đổi", variant: "secondary" },
};

const fmtMoney = (v?: number | null) => v ? v.toLocaleString("vi-VN") + "₫" : "-";

export default function Domains() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListDomains({ search: search || undefined });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListDomainsQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active" } });
  const createMut = useMutation({ mutationFn: (d: FV) => createDomain(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm domain" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateDomain(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteDomain(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active" }); setEditing(null); setOpen(true); };
  const openEdit = (d: any) => {
    form.reset({ customerId: d.customerId, domainName: d.domainName, provider: d.provider, registerDate: d.registerDate, expireDate: d.expireDate, buyPrice: d.buyPrice, sellPrice: d.sellPrice, status: d.status, note: d.note ?? "" });
    setEditing({ id: d.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Quản Lý Domain">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm domain..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm domain</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên Domain</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Nhà Cung Cấp</TableHead>
              <TableHead>Hết Hạn</TableHead>
              <TableHead className="text-center">Còn</TableHead>
              <TableHead className="text-right">Giá Mua</TableHead>
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
            ) : (data as any)?.data?.map((d: any) => {
              const st = statusMap[d.status] || { label: d.status, variant: "secondary" as const };
              const warn = d.daysUntilExpiry <= 30;
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium font-mono text-sm">{d.domainName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.customerName || "-"}</TableCell>
                  <TableCell className="text-sm">{d.provider}</TableCell>
                  <TableCell className="text-sm">{d.expireDate}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold ${warn ? "text-destructive" : "text-green-600"} flex items-center justify-center gap-1`}>
                      {warn && <AlertTriangle className="h-3 w-3" />}{d.daysUntilExpiry}d
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(d.buyPrice)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(d.sellPrice)}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa domain này?")) deleteMut.mutate(d.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa domain" : "Thêm domain"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="domainName" render={({ field }) => (<FormItem><FormLabel>Tên domain *</FormLabel><FormControl><Input placeholder="example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="provider" render={({ field }) => (<FormItem><FormLabel>Nhà cung cấp *</FormLabel><FormControl><Input placeholder="Matbao, Godaddy..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="registerDate" render={({ field }) => (<FormItem><FormLabel>Ngày đăng ký *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="expireDate" render={({ field }) => (<FormItem><FormLabel>Ngày hết hạn *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="buyPrice" render={({ field }) => (<FormItem><FormLabel>Giá mua (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sellPrice" render={({ field }) => (<FormItem><FormLabel>Giá bán (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="expired">Hết hạn</SelectItem><SelectItem value="transferred">Chuyển đổi</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
