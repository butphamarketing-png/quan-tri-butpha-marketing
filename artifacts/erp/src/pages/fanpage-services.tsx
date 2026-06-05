import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListFanpageServices, getListFanpageServicesQueryKey, createFanpageService, updateFanpageService, deleteFanpageService } from "@workspace/api-client-react";
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
  packageName: z.string().min(1, "Bắt buộc"),
  postsPerMonth: z.coerce.number().min(0).default(0),
  reelsPerMonth: z.coerce.number().min(0).default(0),
  monthlyFee: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, "Bắt buộc"),
  endDate: z.string().min(1, "Bắt buộc"),
  status: z.string().default("active"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Đang chạy", variant: "default" },
  expired: { label: "Hết hạn", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "secondary" },
};
const fmtMoney = (v?: number | null) => v ? v.toLocaleString("vi-VN") + "₫" : "-";

export default function FanpageServices() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListFanpageServices({});
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListFanpageServicesQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active", postsPerMonth: 0, reelsPerMonth: 0 } });
  const createMut = useMutation({ mutationFn: (d: FV) => createFanpageService(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm dịch vụ" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateFanpageService(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteFanpageService(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active", postsPerMonth: 0, reelsPerMonth: 0 }); setEditing(null); setOpen(true); };
  const openEdit = (s: any) => {
    form.reset({ customerId: s.customerId, packageName: s.packageName, postsPerMonth: s.postsPerMonth, reelsPerMonth: s.reelsPerMonth, monthlyFee: s.monthlyFee, startDate: s.startDate, endDate: s.endDate, status: s.status });
    setEditing({ id: s.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Dịch Vụ Fanpage">
      <div className="flex justify-end mb-6">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm dịch vụ</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Gói Dịch Vụ</TableHead>
              <TableHead className="text-center">Bài/Tháng</TableHead>
              <TableHead className="text-center">Reels/Tháng</TableHead>
              <TableHead className="text-right">Phí/Tháng</TableHead>
              <TableHead>Thời Hạn</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((s: any) => {
              const st = statusMap[s.status] || { label: s.status, variant: "secondary" as const };
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-sm text-muted-foreground">{s.customerName || "-"}</TableCell>
                  <TableCell className="font-medium">{s.packageName}</TableCell>
                  <TableCell className="text-center text-sm">{s.postsPerMonth}</TableCell>
                  <TableCell className="text-center text-sm">{s.reelsPerMonth}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(s.monthlyFee)}</TableCell>
                  <TableCell className="text-sm">{s.startDate} → {s.endDate}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa?")) deleteMut.mutate(s.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="packageName" render={({ field }) => (<FormItem><FormLabel>Gói dịch vụ *</FormLabel><FormControl><Input placeholder="Gói Basic, Pro..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="postsPerMonth" render={({ field }) => (<FormItem><FormLabel>Bài viết/tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="reelsPerMonth" render={({ field }) => (<FormItem><FormLabel>Reels/tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="monthlyFee" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Chi phí/tháng (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Ngày bắt đầu *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Ngày kết thúc *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Đang chạy</SelectItem><SelectItem value="expired">Hết hạn</SelectItem><SelectItem value="cancelled">Đã hủy</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
