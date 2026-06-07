import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Receipts from "@/pages/receipts";
import Expenses from "@/pages/expenses";
import AccountsReceivable from "@/pages/accounts-receivable";
import AccountsPayable from "@/pages/accounts-payable";
import RevenueReport from "@/pages/reports/revenue";
import ExpenseReport from "@/pages/reports/expense";
import ProfitReport from "@/pages/reports/profit";
import CashFlowReport from "@/pages/reports/cash-flow";
import CustomerReport from "@/pages/reports/by-customer";
import ServiceReport from "@/pages/reports/by-service";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import Services from "@/pages/services";
import Contracts from "@/pages/contracts";
import AuditLogs from "@/pages/audit-logs";

import Domains from "@/pages/domains";
import Hostings from "@/pages/hostings";
import Websites from "@/pages/websites";
import Fanpages from "@/pages/fanpages";
import FanpageServices from "@/pages/fanpage-services";
import FacebookAds from "@/pages/facebook-ads";
import GoogleAds from "@/pages/google-ads";
import GoogleProfiles from "@/pages/google-profiles";
import Employees from "@/pages/employees";
import Debts from "@/pages/debts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Guarded({ comp: Comp, title }: { comp: ComponentType; title?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isAuthenticated, isLoading, setLocation]);
  if (isLoading) return <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">Đang tải...</div>;
  if (!isAuthenticated) return null;
  if (title !== undefined) return <Layout title={title}><Comp /></Layout>;
  return <Comp />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={() => {
        if (isAuthenticated) { setLocation("/"); return null; }
        return <LoginPage />;
      }} />
      <Route path="/" component={() => <Guarded comp={Dashboard} title="Tổng Quan" />} />
      <Route path="/admin" component={() => <Guarded comp={Dashboard} title="Tổng Quan" />} />
      <Route path="/receipts" component={() => <Guarded comp={Receipts} title="Phiếu Thu" />} />
      <Route path="/admin/receipts" component={() => <Guarded comp={Receipts} title="Phiếu Thu" />} />
      <Route path="/expenses" component={() => <Guarded comp={Expenses} title="Phiếu Chi" />} />
      <Route path="/admin/expenses" component={() => <Guarded comp={Expenses} title="Phiếu Chi" />} />
      <Route path="/accounts-receivable" component={() => <Guarded comp={AccountsReceivable} title="Công Nợ Phải Thu" />} />
      <Route path="/admin/accounts-receivable" component={() => <Guarded comp={AccountsReceivable} title="Công Nợ Phải Thu" />} />
      <Route path="/accounts-payable" component={() => <Guarded comp={AccountsPayable} title="Công Nợ Phải Trả" />} />
      <Route path="/admin/accounts-payable" component={() => <Guarded comp={AccountsPayable} title="Công Nợ Phải Trả" />} />
      <Route path="/reports/revenue" component={() => <Guarded comp={RevenueReport} title="Báo Cáo Doanh Thu" />} />
      <Route path="/admin/reports/revenue" component={() => <Guarded comp={RevenueReport} title="Báo Cáo Doanh Thu" />} />
      <Route path="/reports/expenses" component={() => <Guarded comp={ExpenseReport} title="Báo Cáo Chi Phí" />} />
      <Route path="/admin/reports/expenses" component={() => <Guarded comp={ExpenseReport} title="Báo Cáo Chi Phí" />} />
      <Route path="/reports/profit" component={() => <Guarded comp={ProfitReport} title="Báo Cáo Lợi Nhuận" />} />
      <Route path="/admin/reports/profit" component={() => <Guarded comp={ProfitReport} title="Báo Cáo Lợi Nhuận" />} />
      <Route path="/reports/cash-flow" component={() => <Guarded comp={CashFlowReport} title="Báo Cáo Dòng Tiền" />} />
      <Route path="/admin/reports/cash-flow" component={() => <Guarded comp={CashFlowReport} title="Báo Cáo Dòng Tiền" />} />
      <Route path="/reports/by-customer" component={() => <Guarded comp={CustomerReport} title="Báo Cáo Theo Khách Hàng" />} />
      <Route path="/admin/reports/by-customer" component={() => <Guarded comp={CustomerReport} title="Báo Cáo Theo Khách Hàng" />} />
      <Route path="/reports/by-service" component={() => <Guarded comp={ServiceReport} title="Báo Cáo Theo Dịch Vụ" />} />
      <Route path="/admin/reports/by-service" component={() => <Guarded comp={ServiceReport} title="Báo Cáo Theo Dịch Vụ" />} />
      <Route path="/customers" component={() => <Guarded comp={Customers} title="Khách Hàng" />} />
      <Route path="/admin/customers" component={() => <Guarded comp={Customers} title="Khách Hàng" />} />
      <Route path="/suppliers" component={() => <Guarded comp={Suppliers} title="Nhà Cung Cấp" />} />
      <Route path="/admin/suppliers" component={() => <Guarded comp={Suppliers} title="Nhà Cung Cấp" />} />
      <Route path="/services" component={() => <Guarded comp={Services} title="Dịch Vụ" />} />
      <Route path="/admin/services" component={() => <Guarded comp={Services} title="Dịch Vụ" />} />
      <Route path="/contracts" component={() => <Guarded comp={Contracts} title="Hợp Đồng" />} />
      <Route path="/admin/contracts" component={() => <Guarded comp={Contracts} title="Hợp Đồng" />} />
      <Route path="/audit-logs" component={() => <Guarded comp={AuditLogs} title="Nhật Ký Hoạt Động" />} />
      <Route path="/admin/audit-logs" component={() => <Guarded comp={AuditLogs} title="Nhật Ký Hoạt Động" />} />
      <Route path="/domains" component={() => <Guarded comp={Domains} />} />
      <Route path="/admin/domains" component={() => <Guarded comp={Domains} />} />
      <Route path="/admin/domain" component={() => <Guarded comp={Domains} />} />
      <Route path="/hostings" component={() => <Guarded comp={Hostings} />} />
      <Route path="/admin/hostings" component={() => <Guarded comp={Hostings} />} />
      <Route path="/websites" component={() => <Guarded comp={Websites} />} />
      <Route path="/admin/websites" component={() => <Guarded comp={Websites} />} />
      <Route path="/fanpages" component={() => <Guarded comp={Fanpages} />} />
      <Route path="/admin/fanpages" component={() => <Guarded comp={Fanpages} />} />
      <Route path="/fanpage-services" component={() => <Guarded comp={FanpageServices} />} />
      <Route path="/admin/fanpage-services" component={() => <Guarded comp={FanpageServices} />} />
      <Route path="/facebook-ads" component={() => <Guarded comp={FacebookAds} />} />
      <Route path="/admin/facebook-ads" component={() => <Guarded comp={FacebookAds} />} />
      <Route path="/google-ads" component={() => <Guarded comp={GoogleAds} />} />
      <Route path="/admin/google-ads" component={() => <Guarded comp={GoogleAds} />} />
      <Route path="/google-profiles" component={() => <Guarded comp={GoogleProfiles} />} />
      <Route path="/admin/google-profiles" component={() => <Guarded comp={GoogleProfiles} />} />
      <Route path="/employees" component={() => <Guarded comp={Employees} />} />
      <Route path="/admin/employees" component={() => <Guarded comp={Employees} />} />
      <Route path="/debts" component={() => <Guarded comp={Debts} />} />
      <Route path="/admin/debts" component={() => <Guarded comp={Debts} />} />
      <Route component={() => <Layout title="Không Tìm Thấy"><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
