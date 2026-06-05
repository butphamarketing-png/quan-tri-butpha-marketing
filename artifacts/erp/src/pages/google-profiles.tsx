import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useListCustomers, useListGoogleProfiles, getListGoogleProfilesQueryKey, createGoogleProfile, updateGoogleProfile, deleteGoogleProfile } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, MapPin, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  customerId: z.coerce.number().min(1, "Bắt buộc"),
  businessName: z.string().min(1, "Bắt buộc"),
  mapLink: z.string().optional(),
  category: z.string().optional(),
  reviewCount: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  status: z.string().default("active"),
});
type FV = z.infer<typeof schema>;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Hoạt động", variant: "default" },
  suspended: { label: "Bị khóa", variant: "destructive" },
  inactive: { label: "Không hoạt động", variant: "secondary" },
};

export default function GoogleProfiles() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const { data, isLoading } = useListGoogleProfiles({ search: search || undefined });
  const { data: customers } = useListCustomers({ limit: 200 });
  const { toast } = useToast();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListGoogleProfilesQueryKey() });

  const form = useForm<FV>({ resolver: zodResolver(schema), defaultValues: { status: "active" } });
  const createMut = useMutation({ mutationFn: (d: FV) => createGoogleProfile(d as any), onSuccess: () => { invalidate(); toast({ title: "Đã thêm hồ sơ" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, d }: { id: number; d: FV }) => updateGoogleProfile(id, d as any), onSuccess: () => { invalidate(); toast({ title: "Đã cập nhật" }); setOpen(false); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteGoogleProfile(id), onSuccess: () => { invalidate(); toast({ title: "Đã xóa" }); }, onError: () => toast({ title: "Lỗi", variant: "destructive" }) });

  const openCreate = () => { form.reset({ status: "active" }); setEditing(null); setOpen(true); };
  const openEdit = (g: any) => {
    form.reset({ customerId: g.customerId, businessName: g.businessName, mapLink: g.mapLink ?? "", category: g.category ?? "", reviewCount: g.reviewCount, rating: g.rating, status: g.status });
    setEditing({ id: g.id }); setOpen(true);
  };
  const onSubmit = (d: FV) => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d);

  return (
    <Layout title="Google Maps Business">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm hồ sơ..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Thêm hồ sơ</Button>
      </div>
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tên Doanh Nghiệp</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Danh Mục</TableHead>
              <TableHead className="text-center">Đánh Giá</TableHead>
              <TableHead className="text-center">Reviews</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>)}</TableRow>
            )) : (data as any)?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (data as any)?.data?.map((g: any) => {
              const st = statusMap[g.status] || { label: g.status, variant: "secondary" as const };
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {g.businessName}
                      {g.mapLink && <a href={g.mapLink} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70"><MapPin className="h-3.5 w-3.5" /></a>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.customerName || "-"}</TableCell>
                  <TableCell className="text-sm">{g.category || "-"}</TableCell>
                  <TableCell className="text-center">
                    {g.rating ? <span className="flex items-center justify-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{Number(g.rating).toFixed(1)}</span> : "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm">{g.reviewCount ?? "-"}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => { if (confirm("Xóa hồ sơ này?")) deleteMut.mutate(g.id); }}><Trash2 className="h-4 w-4" />Xóa</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Sửa hồ sơ" : "Thêm hồ sơ Google Maps"}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>Khách hàng *</FormLabel><Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger></FormControl><SelectContent>{customers?.data?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="businessName" render={({ field }) => (<FormItem><FormLabel>Tên doanh nghiệp *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="mapLink" render={({ field }) => (<FormItem><FormLabel>Link Google Maps</FormLabel><FormControl><Input placeholder="https://maps.google.com/..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Danh mục</FormLabel><FormControl><Input placeholder="Nhà hàng, Spa..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>Đánh giá (0-5)</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="reviewCount" render={({ field }) => (<FormItem><FormLabel>Số đánh giá</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Trạng thái</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="suspended">Bị khóa</SelectItem><SelectItem value="inactive">Không HĐ</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Cập nhật" : "Thêm mới"}</Button></div>
          </form></Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
