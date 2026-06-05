import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListFanpages, getListFanpagesQueryKey, createFanpage, updateFanpage, deleteFanpage } from "@workspace/api-client-react";
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
  pageName: z.string().min(1, "Bắt buộc"),
  pageUrl: z.string().url("URL không hợp lệ"),
  pageId: z.string().optional(),
  category: z.string().optional(),
  followers: z.coerce.number().optional(),
  status: z.string().default("active"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang chạy", variant: "default" },
  paused: { label: "Tạm dừng", variant: "secondary" },
  closed: { label: "Đã đóng", variant: "destructive" },
};

export default function Fanpages() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListFanpages({ search: search || undefined });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListFanpagesQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active" } });
  const createMut = useMutation({ mutationFn: (d: FV) => createFanpage(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm fanpage" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateFanpage(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteFanpage(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active" }); setEditing(null); setOpen(true); };
  const openEdit = (f: any) => {
    form.reset({ customerId: f.customerId, pageName: f.pageName, pageUrl: f.pageUrl, pageId: f.pageId ?? "", category: f.category ?? "", followers: f.followers, status: f.status });
    setEditing({ id: f.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Quản Lý Fanpage">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm fanpage..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm fanpage</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên Fanpage</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Danh Mục</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((f: any) => {
              const st = statusMap[f.status] || { label: f.status, variant: "secondary" as const };
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {f.pageName}
                      <a href={f.pageUrl} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70"><ExternalLink className="h-3.5 w-3.5" /></a>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.customerName || "-"}</TableCell>
                  <TableCell className="text-sm">{f.category || "-"}</TableCell>
                  <TableCell className="text-right text-sm">{f.followers ? f.followers.toLocaleString("vi-VN") : "-"}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa fanpage này?")) deleteMut.mutate(f.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa fanpage" : "Thêm fanpage"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="pageName" render={({ field }) => (<FormItem><FormLabel>Tên fanpage *</FormLabel><FormControl><Input placeholder="Bứt Phá Marketing" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="pageUrl" render={({ field }) => (<FormItem><FormLabel>URL fanpage *</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pageId" render={({ field }) => (<FormItem><FormLabel>Page ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="followers" render={({ field }) => (<FormItem><FormLabel>Followers</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Danh mục</FormLabel><FormControl><Input placeholder="Marketing, Ẩm thực..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Đang chạy</SelectItem><SelectItem value="paused">Tạm dừng</SelectItem><SelectItem value="closed">Đã đóng</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
