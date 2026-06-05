import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        
        <Route path="/receipts" component={Receipts} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/accounts-receivable" component={AccountsReceivable} />
        <Route path="/accounts-payable" component={AccountsPayable} />
        
        <Route path="/reports/revenue" component={RevenueReport} />
        <Route path="/reports/expenses" component={ExpenseReport} />
        <Route path="/reports/profit" component={ProfitReport} />
        <Route path="/reports/cash-flow" component={CashFlowReport} />
        <Route path="/reports/customers" component={CustomerReport} />
        <Route path="/reports/services" component={ServiceReport} />
        
        <Route path="/customers" component={Customers} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/services" component={Services} />
        <Route path="/contracts" component={Contracts} />
        
        <Route path="/audit-logs" component={AuditLogs} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
