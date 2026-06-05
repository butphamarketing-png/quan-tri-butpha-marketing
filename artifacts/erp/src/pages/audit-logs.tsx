import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";

const ENTITY_TYPES = ["customer", "service", "supplier", "contract", "receipt", "expense"];
const ACTIONS = ["create", "update", "delete"];

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useListAuditLogs({ entityType: entityType || undefined, action: action || undefined, page, limit: 20 });

  const actionColors: Record<string, string> = { create: "text-green-600", update: "text-blue-600", delete: "text-red-600" };
  const actionLabels: Record<string, string> = { create: "Tạo mới", update: "Cập nhật", delete: "Xóa" };
  const entityLabels: Record<string, string> = { customer: "Khách hàng", service: "Dịch vụ", supplier: "Nhà cung cấp", contract: "Hợp đồng", receipt: "Phiếu thu", expense: "Phiếu chi" };

  const rows = (data?.data ?? []) as Record<string, unknown>[];
  const columns = [
    { key: "createdAt", header: "Thời Gian", render: (r: Record<string, unknown>) => formatDateTime(r.createdAt as string) },
    { key: "entityType", header: "Đối Tượng", render: (r: Record<string, unknown>) => entityLabels[r.entityType as string] ?? String(r.entityType) },
    { key: "entityId", header: "ID" },
    { key: "action", header: "Hành Động", render: (r: Record<string, unknown>) => <span className={`font-medium ${actionColors[r.action as string] ?? ""}`}>{actionLabels[r.action as string] ?? String(r.action)}</span> },
    { key: "performedBy", header: "Người Thực Hiện" },
    {
      key: "changes", header: "Thay Đổi", render: (r: Record<string, unknown>) => {
        if (r.action === "create") return <span className="text-xs text-muted-foreground">Tạo mới bản ghi</span>;
        if (r.action === "delete") return <span className="text-xs text-muted-foreground">Xóa bản ghi</span>;
        return <span className="text-xs text-muted-foreground">Xem chi tiết</span>;
      }
    },
  ];

  return (
    <div>
      <PageHeader title="Nhật Ký Hệ Thống" subtitle="Lịch sử các thao tác thay đổi dữ liệu" />

      <div className="flex gap-3 mb-4">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả đối tượng" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{entityLabels[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả hành động" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {ACTIONS.map(a => <SelectItem key={a} value={a}>{actionLabels[a]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable data={rows} columns={columns} total={data?.total ?? 0} page={page} limit={20} onPageChange={setPage} loading={isLoading} emptyMessage="Không có nhật ký" />
    </div>
  );
}
