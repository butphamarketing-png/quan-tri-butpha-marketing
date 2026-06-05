import { useState } from "react";
import { useGetCustomerReport } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/format";

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = [{ value: "", label: "Cả năm" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))];

export default function CustomerReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");

  const { data, isLoading } = useGetCustomerReport({ year, month: month ? Number(month) : undefined });
  const rows = (data ?? []) as Array<{ customerId: number; customerName: string; revenue: number; receivable: number; profit: number }>;

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalReceivable = rows.reduce((s, r) => s + r.receivable, 0);

  return (
    <div>
      <PageHeader title="Báo Cáo Theo Khách Hàng" subtitle="Doanh thu và công nợ phân theo khách hàng">
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs">
          <span className="text-green-600">Tổng DT: </span>
          <span className="font-bold text-green-700">{formatVND(totalRevenue)}</span>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 border-b"><th className="px-4 py-3 text-left">Khách Hàng</th><th className="px-4 py-3 text-right">Doanh Thu</th><th className="px-4 py-3 text-right">Công Nợ</th><th className="px-4 py-3 text-right">Lợi Nhuận</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                : rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.customerName}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatVND(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatVND(r.receivable)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatVND(r.profit)}</td>
                  </tr>
                ))}
            {rows.length > 0 && <tr className="bg-muted/20 font-semibold"><td className="px-4 py-3">Tổng cộng</td><td className="px-4 py-3 text-right text-green-700">{formatVND(totalRevenue)}</td><td className="px-4 py-3 text-right text-orange-700">{formatVND(totalReceivable)}</td><td className="px-4 py-3 text-right text-blue-700">{formatVND(totalRevenue)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
