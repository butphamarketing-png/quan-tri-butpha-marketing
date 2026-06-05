import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListDebts, getListDebtsQueryKey, createDebt, updateDebt, deleteDebt } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Bắt buộc"),
  totalAmount: z.coerce.number().min(0, "Bắt buộc"),
  paidAmount: z.coerce.number().min(0).default(0),
  dueDate: z.string().min(1, "Bắt buộc"),
  status: z.string().default("pending"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chưa thanh toán", variant: "secondary" },
  partial: { label: "Thanh toán một phần", variant: "outline" },
  paid: { label: "Đã thanh toán", variant: "default" },
  overdue: { label: "Quá hạn", variant: "destructive" },
};
const fmtMoney = (v?: number | null) => v != null ? v.toLocaleString("vi-VN") + "₫" : "-";

export default function Debts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListDebts({});
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListDebtsQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "pending", paidAmount: 0 } });
  const createMut = useMutation({ mutationFn: (d: FV) => createDebt(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm công nợ" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateDebt(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteDebt(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "pending", paidAmount: 0 }); setEditing(null); setOpen(true); };
  const openEdit = (d: any) => {
    form.reset({ customerId: d.customerId, totalAmount: d.totalAmount, paidAmount: d.paidAmount, dueDate: d.dueDate, status: d.status });
    setEditing({ id: d.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <Layout title="Quản Lý Công Nợ">
      <div className="flex justify-end mb-6">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm công nợ</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Khách Hàng</TableHead>
              <TableHead className="text-right">Tổng Nợ</TableHead>
              <TableHead className="text-right">Đã Trả</TableHead>
              <TableHead className="text-right">Còn Lại</TableHead>
              <TableHead>Hạn Thanh Toán</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không có công nợ</TableCell></TableRow>
            ) : (data as any)?.data?.map((d: any) => {
              const remaining = d.totalAmount - d.paidAmount;
              const overdue = d.status !== "paid" && isOverdue(d.dueDate);
              const st = overdue ? statusMap.overdue : (statusMap[d.status] || { label: d.status, variant: "secondary" as const });
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.customerName || "-"}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(d.totalAmount)}</TableCell>
                  <TableCell className="text-right text-sm text-green-600">{fmtMoney(d.paidAmount)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{fmtMoney(remaining)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={`flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
                      {overdue && <AlertTriangle className="h-3.5 w-3.5" />}{d.dueDate}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa công nợ này?")) deleteMut.mutate(d.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa công nợ" : "Thêm công nợ"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="totalAmount" render={({ field }) => (<FormItem><FormLabel>Tổng nợ (₫) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="paidAmount" render={({ field }) => (<FormItem><FormLabel>Đã thanh toán (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Hạn thanh toán *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Chưa thanh toán</SelectItem><SelectItem value="partial">Một phần</SelectItem><SelectItem value="paid">Đã thanh toán</SelectItem><SelectItem value="overdue">Quá hạn</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
