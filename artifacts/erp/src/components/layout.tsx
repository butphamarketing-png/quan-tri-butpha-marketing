import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, Globe, Server, Monitor, Facebook, BookOpen, MapPin, Megaphone, Search,
  Receipt, CreditCard, TrendingUp, TrendingDown, DollarSign, BarChart3,
  Users, Package, Briefcase, FileText, UserCheck, ClipboardList,
  Menu, X, Sun, Moon, LogOut, ChevronDown,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: React.ElementType; }
interface NavGroup { title?: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Tổng Quan", icon: LayoutDashboard },
    ],
  },
  {
    title: "Tài Sản Số",
    items: [
      { href: "/domains", label: "Domain", icon: Globe },
      { href: "/hostings", label: "Hosting", icon: Server },
      { href: "/websites", label: "Website", icon: Monitor },
      { href: "/fanpages", label: "Fanpage", icon: Facebook },
      { href: "/fanpage-services", label: "Dịch Vụ Fanpage", icon: BookOpen },
      { href: "/google-profiles", label: "Google Maps", icon: MapPin },
      { href: "/facebook-ads", label: "Facebook Ads", icon: Megaphone },
      { href: "/google-ads", label: "Google Ads", icon: Search },
    ],
  },
  {
    title: "Tài Chính",
    items: [
      { href: "/receipts", label: "Phiếu Thu", icon: Receipt },
      { href: "/expenses", label: "Phiếu Chi", icon: CreditCard },
      { href: "/accounts-receivable", label: "Công Nợ Phải Thu", icon: TrendingUp },
      { href: "/accounts-payable", label: "Công Nợ Phải Trả", icon: TrendingDown },
      { href: "/debts", label: "Quản Lý Công Nợ", icon: DollarSign },
    ],
  },
  {
    title: "Báo Cáo",
    items: [
      { href: "/reports/revenue", label: "Doanh Thu", icon: BarChart3 },
      { href: "/reports/expenses", label: "Chi Phí", icon: BarChart3 },
      { href: "/reports/profit", label: "Lợi Nhuận", icon: BarChart3 },
      { href: "/reports/cash-flow", label: "Dòng Tiền", icon: BarChart3 },
      { href: "/reports/by-customer", label: "Theo Khách Hàng", icon: BarChart3 },
      { href: "/reports/by-service", label: "Theo Dịch Vụ", icon: BarChart3 },
    ],
  },
  {
    title: "Danh Mục",
    items: [
      { href: "/customers", label: "Khách Hàng", icon: Users },
      { href: "/suppliers", label: "Nhà Cung Cấp", icon: Package },
      { href: "/services", label: "Dịch Vụ", icon: Briefcase },
      { href: "/contracts", label: "Hợp Đồng", icon: FileText },
      { href: "/employees", label: "Nhân Viên", icon: UserCheck },
    ],
  },
  {
    title: "Hệ Thống",
    items: [
      { href: "/audit-logs", label: "Nhật Ký Hoạt Động", icon: ClipboardList },
    ],
  },
];

export interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [location] = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(d => !d);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-transform transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:block flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-6 font-bold text-lg border-b border-sidebar-border shrink-0">
          <span className="text-sidebar-foreground tracking-tight">Bứt Phá ERP</span>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group, i) => (
            <div key={i}>
              {group.title && <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">{group.title}</div>}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm cursor-pointer ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/75"
                      }`}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 flex items-center px-4 lg:px-6 border-b bg-background justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {title && <h1 className="font-semibold text-base tracking-tight truncate">{title}</h1>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full">
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-none">{user?.fullName || "Người dùng"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{user?.role || ""}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b">
                  <div className="text-sm font-medium">{user?.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                  <div className="text-xs text-primary font-medium mt-0.5">{user?.role}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                  <LogOut className="h-4 w-4" />Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export { Layout };
