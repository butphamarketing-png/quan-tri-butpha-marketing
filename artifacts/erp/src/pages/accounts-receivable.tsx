import { useState } from "react";
import { useListAccountsReceivable } from "@workspace/api-client-react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND, formatDate } from "@/lib/format";

export default function AccountsReceivable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useListAccountsReceivable({ status: status || undefined, page, limit: 20 });

  const rows = (data?.data ?? []) as Record<string, unknown>[];
  const columns = [
    { key: "contractCode", header: "Mã Hợp Đồng" },
    { key: "customerName", header: "Khách Hàng" },
    { key: "totalContractValue", header: "Giá Trị HĐ", render: (r: Record<string, unknown>) => formatVND(r.totalContractValue as number) },
    { key: "paidAmount", header: "Đã Thu", render: (r: Record<string, unknown>) => <span className="text-green-600 font-medium">{formatVND(r.paidAmount as number)}</span> },
    { key: "remainingAmount", header: "Còn Phải Thu", render: (r: Record<string, unknown>) => <span className="text-orange-600 font-semibold">{formatVND(r.remainingAmount as number)}</span> },
    { key: "dueDate", header: "Hạn Thanh Toán", render: (r: Record<string, unknown>) => formatDate(r.dueDate as string) },
    { key: "status", header: "Trạng Thái", render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
  ];

  const totalReceivable = (data as Record<string, unknown>)?.totalReceivable as number ?? 0;

  return (
    <div>
      <PageHeader title="Công Nợ Phải Thu" subtitle="Theo dõi các khoản tiền khách hàng còn nợ">
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-2 text-sm">
          <span className="text-orange-600 font-medium">Tổng phải thu: </span>
          <span className="text-orange-700 font-bold">{formatVND(totalReceivable)}</span>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
            <SelectItem value="overdue">Quá hạn</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Không có công nợ phải thu" />
    </div>
  );
}
