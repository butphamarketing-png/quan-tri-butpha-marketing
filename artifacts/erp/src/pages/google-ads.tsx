import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListGoogleAds, getListGoogleAdsQueryKey, createGoogleAd, updateGoogleAd, deleteGoogleAd } from "@workspace/api-client-react";
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
  campaignName: z.string().min(1, "Bắt buộc"),
  budget: z.coerce.number().min(0, "Bắt buộc"),
  spend: z.coerce.number().min(0).default(0),
  leads: z.coerce.number().min(0).default(0),
  impressions: z.coerce.number().min(0).default(0),
  phoneCalls: z.coerce.number().min(0).default(0),
  directions: z.coerce.number().min(0).default(0),
  status: z.string().default("active"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Đang chạy", variant: "default" },
  paused: { label: "Tạm dừng", variant: "secondary" },
  inactive: { label: "Dừng hoạt động", variant: "destructive" },
};
const fmtMoney = (v?: number | null) => v != null ? v.toLocaleString("vi-VN") + "₫" : "0₫";

export default function GoogleAds() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListGoogleAds({});
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListGoogleAdsQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active", spend: 0, leads: 0, impressions: 0, phoneCalls: 0, directions: 0 } });
  const createMut = useMutation({ mutationFn: (d: FV) => createGoogleAd(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm chiến dịch" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateGoogleAd(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteGoogleAd(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active", spend: 0, leads: 0, impressions: 0, phoneCalls: 0, directions: 0 }); setEditing(null); setOpen(true); };
  const openEdit = (a: any) => {
    form.reset({ customerId: a.customerId, campaignName: a.campaignName, budget: a.budget, spend: a.spend, leads: a.leads, impressions: a.impressions, phoneCalls: a.phoneCalls, directions: a.directions, status: a.status });
    setEditing({ id: a.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Google Ads">
      <div className="flex justify-end mb-6">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm chiến dịch</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Tên Chiến Dịch</TableHead>
              <TableHead className="text-right">Ngân Sách</TableHead>
              <TableHead className="text-right">Chi Tiêu</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead className="text-center">Lượt Hiển Thị</TableHead>
              <TableHead className="text-center">Gọi ĐT</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((a: any) => {
              const st = statusMap[a.status] || { label: a.status, variant: "secondary" as const };
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.customerName || "-"}</TableCell>
                  <TableCell className="text-sm">{a.campaignName}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(a.budget)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(a.spend)}</TableCell>
                  <TableCell className="text-center text-sm font-semibold">{a.leads}</TableCell>
                  <TableCell className="text-center text-sm">{a.impressions.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-center text-sm">{a.phoneCalls}</TableCell>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Sửa chiến dịch" : "Thêm chiến dịch Google Ads"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="campaignName" render={({ field }) => (<FormItem><FormLabel>Tên chiến dịch *</FormLabel><FormControl><Input placeholder="Search - Nhà hàng HCM" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="budget" render={({ field }) => (<FormItem><FormLabel>Ngân sách (₫) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="spend" render={({ field }) => (<FormItem><FormLabel>Chi tiêu (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="leads" render={({ field }) => (<FormItem><FormLabel>Leads</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="impressions" render={({ field }) => (<FormItem><FormLabel>Lượt hiển thị</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phoneCalls" render={({ field }) => (<FormItem><FormLabel>Cuộc gọi</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="directions" render={({ field }) => (<FormItem><FormLabel>Chỉ đường</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Đang chạy</SelectItem><SelectItem value="paused">Tạm dừng</SelectItem><SelectItem value="inactive">Dừng hoạt động</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
