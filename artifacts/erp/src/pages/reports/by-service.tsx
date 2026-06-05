import { useState } from "react";
import { useGetServiceReport } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatVND } from "@/lib/format";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = [{ value: "", label: "Cả năm" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))];
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ServiceReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");

  const { data, isLoading } = useGetServiceReport({ year, month: month ? Number(month) : undefined });
  const rows = (data ?? []) as Array<{ serviceType: string; revenue: number; expenses: number; profit: number }>;

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const pieData = rows.filter(r => r.revenue > 0).map(r => ({ name: r.serviceType, value: r.revenue }));

  return (
    <div>
      <PageHeader title="Báo Cáo Theo Dịch Vụ" subtitle="Doanh thu và lợi nhuận phân theo loại dịch vụ">
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs">
          <span className="text-blue-600">Tổng DT: </span>
          <span className="font-bold text-blue-700">{formatVND(totalRevenue)}</span>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        <Select value={month} onValueChange={setMonth}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {pieData.length > 0 && (
        <div className="rounded-xl border bg-card p-5 mb-6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatVND(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 border-b"><th className="px-4 py-3 text-left">Loại Dịch Vụ</th><th className="px-4 py-3 text-right">Doanh Thu</th><th className="px-4 py-3 text-right">Chi Phí</th><th className="px-4 py-3 text-right">Lợi Nhuận</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                : rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3"><StatusBadge status={r.serviceType} /></td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatVND(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatVND(r.expenses)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${r.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatVND(r.profit)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
