import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListFacebookAds, getListFacebookAdsQueryKey, createFacebookAd, updateFacebookAd, deleteFacebookAd } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Bắt buộc"),
  adAccount: z.string().optional(),
  monthlyBudget: z.coerce.number().min(0, "Bắt buộc"),
  spend: z.coerce.number().min(0).default(0),
  leads: z.coerce.number().min(0).default(0),
  status: z.string().default("active"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Đang chạy", variant: "default" },
  paused: { label: "Tạm dừng", variant: "secondary" },
  inactive: { label: "Dừng hoạt động", variant: "destructive" },
};
const fmtMoney = (v?: number | null) => v != null ? v.toLocaleString("vi-VN") + "₫" : "0₫";
const pct = (spend: number, budget: number) => budget > 0 ? Math.round((spend / budget) * 100) : 0;

export default function FacebookAds() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListFacebookAds({});
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListFacebookAdsQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active", spend: 0, leads: 0 } });
  const createMut = useMutation({ mutationFn: (d: FV) => createFacebookAd(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm tài khoản" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateFacebookAd(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteFacebookAd(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active", spend: 0, leads: 0 }); setEditing(null); setOpen(true); };
  const openEdit = (a: any) => {
    form.reset({ customerId: a.customerId, adAccount: a.adAccount ?? "", monthlyBudget: a.monthlyBudget, spend: a.spend, leads: a.leads, status: a.status });
    setEditing({ id: a.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Facebook Ads">
      <div className="flex justify-end mb-6">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm tài khoản</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Tài Khoản Ads</TableHead>
              <TableHead className="text-right">Ngân Sách/Tháng</TableHead>
              <TableHead className="text-right">Chi Tiêu</TableHead>
              <TableHead className="text-center">% Ngân Sách</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((a: any) => {
              const st = statusMap[a.status] || { label: a.status, variant: "secondary" as const };
              const pctUsed = pct(a.spend, a.monthlyBudget);
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.customerName || "-"}</TableCell>
                  <TableCell className="text-sm font-mono">{a.adAccount || "-"}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(a.monthlyBudget)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(a.spend)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-semibold ${pctUsed >= 90 ? "text-destructive" : pctUsed >= 70 ? "text-orange-500" : "text-green-600"}`}>{pctUsed}%</span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${pctUsed >= 90 ? "bg-destructive" : pctUsed >= 70 ? "bg-orange-500" : "bg-primary"}`} style={{ width: `${Math.min(pctUsed, 100)}%` }} /></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold">{a.leads}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa?")) deleteMut.mutate(a.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Sửa tài khoản Ads" : "Thêm tài khoản Facebook Ads"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="adAccount" render={({ field }) => (<FormItem><FormLabel>ID Tài khoản Ads</FormLabel><FormControl><Input placeholder="act_123456789" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="monthlyBudget" render={({ field }) => (<FormItem><FormLabel>Ngân sách/tháng (₫) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="spend" render={({ field }) => (<FormItem><FormLabel>Đã chi tiêu (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="leads" render={({ field }) => (<FormItem><FormLabel>Số leads</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Đang chạy</SelectItem><SelectItem value="paused">Tạm dừng</SelectItem><SelectItem value="inactive">Dừng hoạt động</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
