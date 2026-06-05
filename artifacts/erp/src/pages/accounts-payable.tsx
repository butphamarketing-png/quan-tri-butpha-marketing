import { useState } from "react";
import { useListAccountsPayable } from "@workspace/api-client-react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/format";

export default function AccountsPayable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useListAccountsPayable({ status: (status || undefined) as ("paid" | "unpaid") | undefined, page, limit: 20 });

  const rows = (data?.data ?? []) as unknown as Record<string, unknown>[];
  const columns = [
    { key: "supplierName", header: "Nhà Cung Cấp" },
    { key: "category", header: "Loại", render: (r: Record<string, unknown>) => <StatusBadge status={r.category as string} /> },
    { key: "totalAmount", header: "Tổng Chi", render: (r: Record<string, unknown>) => <span className="font-semibold">{formatVND(r.totalAmount as number)}</span> },
    { key: "paidAmount", header: "Đã Trả", render: (r: Record<string, unknown>) => <span className="text-green-600">{formatVND(r.paidAmount as number)}</span> },
    { key: "remainingAmount", header: "Còn Phải Trả", render: (r: Record<string, unknown>) => <span className="text-red-600 font-semibold">{formatVND(r.remainingAmount as number)}</span> },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
  ];

  const totalPayable = (data as unknown as Record<string, unknown>)?.totalPayable as number ?? 0;

  return (
    <div>
      <PageHeader title="Công Nợ Phải Trả" subtitle="Theo dõi các khoản phải trả nhà cung cấp">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm">
          <span className="text-red-600 font-medium">Tổng phải trả: </span>
          <span className="text-red-700 font-bold">{formatVND(totalPayable)}</span>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Không có công nợ phải trả" />
    </div>
  );
}
