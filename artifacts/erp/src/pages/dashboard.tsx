import { useGetDashboardSummary, useGetRevenueChart, useGetRecentActivity } from "@workspace/api-client-react";
import { formatVND, formatDate } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, CreditCard, DollarSign, PiggyBank, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function StatCard({
  title, value, growth, icon: Icon, color,
}: { title: string; value: string; growth?: number | null; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {growth !== null && growth !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
            {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth)}% so với tháng trước
          </div>
        )}
      </div>
    </div>
  );
}

function RecentList({ title, items, type }: { title: string; items: Array<{ code?: string; amount: number; description?: string; receiptDate?: string; expenseDate?: string; category?: string }>; type: "receipt" | "expense" }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {type === "receipt" ? <ArrowDownRight className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-red-600" />}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.code ?? item.description}</div>
                <div className="text-xs text-muted-foreground">{formatDate(item.receiptDate ?? item.expenseDate ?? "")}</div>
              </div>
              <span className={`text-sm font-semibold whitespace-nowrap ${type === "receipt" ? "text-green-600" : "text-red-600"}`}>
                {formatVND(item.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const { data: chartData } = useGetRevenueChart();
  const { data: activity } = useGetRecentActivity();

  const formatChart = (v: number) => `${(v / 1000000).toFixed(0)}M`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tháng {now.getMonth() + 1}/{now.getFullYear()}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Doanh Thu" value={formatVND(summary?.totalRevenue)} growth={summary?.revenueGrowth} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard title="Chi Phí" value={formatVND(summary?.totalExpenses)} growth={summary?.expenseGrowth} icon={ArrowUpRight} color="bg-red-100 text-red-600" />
        <StatCard title="Lợi Nhuận" value={formatVND(summary?.totalProfit)} growth={summary?.profitGrowth} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
        <StatCard title="Số Dư" value={formatVND(summary?.cashBalance)} icon={PiggyBank} color="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Công Nợ Phải Thu" value={formatVND(summary?.totalReceivable)} icon={Wallet} color="bg-yellow-100 text-yellow-600" />
        <StatCard title="Tổng Công Nợ Phải Trả" value={formatVND(summary?.totalPayable)} icon={CreditCard} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-4">Biểu Đồ Doanh Thu - Chi Phí 12 Tháng</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData ?? []} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatChart} tick={{ fontSize: 11 }} width={45} />
            <Tooltip formatter={(v: number) => formatVND(v)} labelStyle={{ fontWeight: 600 }} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#22c55e" fill="url(#colorRevenue)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="expenses" name="Chi phí" stroke="#ef4444" fill="url(#colorExpenses)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#3b82f6" fill="transparent" strokeWidth={2} strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentList title="Phiếu Thu Gần Đây" items={activity?.recentReceipts ?? []} type="receipt" />
        <RecentList title="Phiếu Chi Gần Đây" items={activity?.recentExpenses ?? []} type="expense" />
      </div>
    </div>
  );
}
