import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListWebsites, getListWebsitesQueryKey, createWebsite, updateWebsite, deleteWebsite } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Bắt buộc"),
  websiteName: z.string().min(1, "Bắt buộc"),
  cms: z.string().min(1, "Bắt buộc"),
  technology: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  deliveryDate: z.string().optional(),
  contractValue: z.coerce.number().optional(),
  adminUrl: z.string().optional(),
  username: z.string().optional(),
  status: z.string().default("completed"),
  note: z.string().optional(),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  completed: { label: "Hoàn thành", variant: "default" },
  in_progress: { label: "Đang làm", variant: "secondary" },
  maintaining: { label: "Bảo trì", variant: "outline" },
  cancelled: { label: "Hủy", variant: "destructive" },
};
const fmtMoney = (v?: number | null) => v ? v.toLocaleString("vi-VN") + "₫" : "-";

export default function Websites() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListWebsites({ search: search || undefined });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListWebsitesQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "completed" } });
  const createMut = useMutation({ mutationFn: (d: FV) => createWebsite(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm website" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateWebsite(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteWebsite(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "completed" }); setEditing(null); setOpen(true); };
  const openEdit = (w: any) => {
    form.reset({ customerId: w.customerId, websiteName: w.websiteName, cms: w.cms, technology: w.technology ?? "", startDate: w.startDate ?? "", deadline: w.deadline ?? "", deliveryDate: w.deliveryDate ?? "", contractValue: w.contractValue, adminUrl: w.adminUrl ?? "", username: w.username ?? "", status: w.status, note: w.note ?? "" });
    setEditing({ id: w.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Quản Lý Website">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm website..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm website</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên Website</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>CMS</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Bàn Giao</TableHead>
              <TableHead className="text-right">Giá Trị HĐ</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((w: any) => {
              const st = statusMap[w.status] || { label: w.status, variant: "secondary" as const };
              return (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {w.websiteName}
                      {w.adminUrl && <a href={w.adminUrl} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{w.customerName || "-"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{w.cms}</Badge></TableCell>
                  <TableCell className="text-sm font-mono">{w.domainName || "-"}</TableCell>
                  <TableCell className="text-sm">{w.deliveryDate || "-"}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(w.contractValue)}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa website này?")) deleteMut.mutate(w.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa website" : "Thêm website"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="websiteName" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Tên website *</FormLabel><FormControl><Input placeholder="Website Công Ty A" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="cms" render={({ field }) => (<FormItem><FormLabel>CMS *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn CMS" /></SelectTrigger></FormControl><SelectContent><SelectItem value="WordPress">WordPress</SelectItem><SelectItem value="Joomla">Joomla</SelectItem><SelectItem value="Laravel">Laravel</SelectItem><SelectItem value="Custom">Custom</SelectItem><SelectItem value="Shopify">Shopify</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="technology" render={({ field }) => (<FormItem><FormLabel>Công nghệ</FormLabel><FormControl><Input placeholder="React, Vue..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Ngày bắt đầu</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="deadline" render={({ field }) => (<FormItem><FormLabel>Deadline</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="deliveryDate" render={({ field }) => (<FormItem><FormLabel>Ngày bàn giao</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="contractValue" render={({ field }) => (<FormItem><FormLabel>Giá trị HĐ (₫)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="adminUrl" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Link admin</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username admin</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">Hoàn thành</SelectItem><SelectItem value="in_progress">Đang làm</SelectItem><SelectItem value="maintaining">Bảo trì</SelectItem><SelectItem value="cancelled">Hủy</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
