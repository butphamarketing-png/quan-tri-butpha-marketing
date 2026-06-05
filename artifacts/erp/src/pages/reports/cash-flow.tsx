import { useState } from "react";
import { useGetCashFlowReport } from "@workspace/api-client-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVND, formatDate } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function CashFlowReport() {
  const now = new Date();
  const [fromDate, setFromDate] = useState(`${now.getFullYear()}-01-01`);
  const [toDate, setToDate] = useState(now.toISOString().split("T")[0]);

  const { data, isLoading } = useGetCashFlowReport({ fromDate, toDate });
  const items = (data?.items ?? []) as Array<{ date: string; type: string; description: string; amount: number; balance: number }>;

  return (
    <div>
      <PageHeader title="Báo Cáo Dòng Tiền" subtitle="Theo dõi dòng tiền vào/ra">
        <div className="flex gap-3">
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs">
            <span className="text-green-600">Thu: </span>
            <span className="font-bold text-green-700">{formatVND(data?.totalInflow as number)}</span>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs">
            <span className="text-red-600">Chi: </span>
            <span className="font-bold text-red-700">{formatVND(data?.totalOutflow as number)}</span>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs">
            <span className="text-blue-600">Ròng: </span>
            <span className={`font-bold ${(data?.netCashFlow as number) >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatVND(data?.netCashFlow as number)}</span>
          </div>
        </div>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <div className="space-y-1"><Label>Từ ngày</Label><Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" /></div>
        <div className="space-y-1"><Label>Đến ngày</Label><Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" /></div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 border-b"><th className="px-4 py-3 text-left">Ngày</th><th className="px-4 py-3 text-left">Mô Tả</th><th className="px-4 py-3 text-right">Vào</th><th className="px-4 py-3 text-right">Ra</th><th className="px-4 py-3 text-right">Số Dư</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Đang tải...</td></tr>
              : items.length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Không có giao dịch</td></tr>
                : items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {item.type === "inflow" ? <ArrowDownRight className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <ArrowUpRight className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">{item.type === "inflow" ? formatVND(item.amount) : ""}</td>
                    <td className="px-4 py-3 text-right text-red-600">{item.type === "outflow" ? formatVND(item.amount) : ""}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${item.balance >= 0 ? "text-foreground" : "text-red-600"}`}>{formatVND(item.balance)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
