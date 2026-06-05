import { useState } from "react";
import { useGetProfitReport } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/format";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const YEARS = [2024, 2025, 2026, 2027];

export default function ProfitReport() {
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useGetProfitReport({ period: period as "monthly" | "quarterly" | "yearly", year });
  const items = (data?.items ?? []) as Array<{ label: string; revenue: number; expenses: number; profit: number }>;

  return (
    <div>
      <PageHeader title="Báo Cáo Lợi Nhuận" subtitle="Phân tích lợi nhuận theo kỳ">
        <div className="flex gap-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm">
            <span className="text-blue-600 font-medium">Lợi nhuận: </span>
            <span className={`font-bold ${(data?.totalProfit as number) >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatVND(data?.totalProfit as number)}</span>
          </div>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Theo tháng</SelectItem><SelectItem value="quarterly">Theo quý</SelectItem><SelectItem value="yearly">Theo năm</SelectItem></SelectContent></Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="rounded-xl border bg-card p-5 mb-6">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={items} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 12 }} width={50} />
            <Tooltip formatter={(v: number) => formatVND(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Doanh thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 border-b"><th className="px-4 py-3 text-left">Kỳ</th><th className="px-4 py-3 text-right">Doanh Thu</th><th className="px-4 py-3 text-right">Chi Phí</th><th className="px-4 py-3 text-right">Lợi Nhuận</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              : items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatVND(item.revenue)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatVND(item.expenses)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.profit >= 0 ? "text-blue-600" : "text-red-600"}`}>{formatVND(item.profit)}</td>
                </tr>
              ))}
            <tr className="bg-muted/20 font-semibold">
              <td className="px-4 py-3">Tổng cộng</td>
              <td className="px-4 py-3 text-right text-green-700">{formatVND(data?.totalRevenue as number)}</td>
              <td className="px-4 py-3 text-right text-red-700">{formatVND(data?.totalExpenses as number)}</td>
              <td className={`px-4 py-3 text-right ${(data?.totalProfit as number) >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatVND(data?.totalProfit as number)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
