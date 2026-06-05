import { useState } from "react";
import { useGetExpenseReport } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const YEARS = [2024, 2025, 2026, 2027];

export default function ExpenseReport() {
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useGetExpenseReport({ period: period as "monthly" | "quarterly" | "yearly", year });
  const items = (data?.items ?? []) as Array<{ label: string; amount: number }>;

  return (
    <div>
      <PageHeader title="Báo Cáo Chi Phí" subtitle="Phân tích chi phí theo kỳ">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm">
          <span className="text-red-600 font-medium">Tổng: </span>
          <span className="text-red-700 font-bold">{formatVND(data?.total as number)}</span>
        </div>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Theo tháng</SelectItem><SelectItem value="quarterly">Theo quý</SelectItem><SelectItem value="yearly">Theo năm</SelectItem></SelectContent></Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="rounded-xl border bg-card p-5 mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={items} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 12 }} width={50} />
            <Tooltip formatter={(v: number) => formatVND(v)} />
            <Bar dataKey="amount" name="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 border-b"><th className="px-4 py-3 text-left">Kỳ</th><th className="px-4 py-3 text-right">Chi Phí</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              : items.map((item, i) => <tr key={i} className="border-b last:border-0"><td className="px-4 py-3">{item.label}</td><td className="px-4 py-3 text-right font-medium text-red-600">{formatVND(item.amount)}</td></tr>)}
            <tr className="bg-muted/20 font-semibold"><td className="px-4 py-3">Tổng cộng</td><td className="px-4 py-3 text-right text-red-700">{formatVND(data?.total as number)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
