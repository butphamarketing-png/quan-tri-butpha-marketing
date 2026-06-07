import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  ArrowDownRight, 
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Briefcase,
  FileText,
  Activity,
  Building2,
  Package,
  Globe,
  Server,
  Monitor,
  MessageSquare,
  MessageCircle,
  Share2,
  MapPin,
  User,
  FileDollar
} from "lucide-react";

import { cn } from "@/lib/utils";
import { 
  Sidebar as SidebarComponent,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";

export function Sidebar() {
  const [location] = useLocation();

  const navGroups = [
    {
      title: "Tổng Quan",
      items: [
        { title: "Tổng Quan", href: "/", icon: LayoutDashboard },
      ]
    },
    {
      title: "Tài Sản",
      items: [
        { title: "Domain", href: "/domains", icon: Globe },
        { title: "Hosting", href: "/hostings", icon: Server },
        { title: "Website", href: "/websites", icon: Monitor },
        { title: "Fanpage", href: "/fanpages", icon: MessageSquare },
        { title: "Dịch Vụ Fanpage", href: "/fanpage-services", icon: MessageCircle },
        { title: "Google Maps", href: "/google-profiles", icon: MapPin },
        { title: "Facebook Ads", href: "/facebook-ads", icon: Share2 },
        { title: "Google Ads", href: "/google-ads", icon: Share2 },
      ]
    },
    {
      title: "Tài Chính",
      items: [
        { title: "Phiếu Thu", href: "/receipts", icon: ArrowDownRight },
        { title: "Phiếu Chi", href: "/expenses", icon: ArrowUpRight },
        { title: "Công Nợ Phải Thu", href: "/accounts-receivable", icon: Wallet },
        { title: "Công Nợ Phải Trả", href: "/accounts-payable", icon: CreditCard },
      ]
    },
    {
      title: "Báo Cáo",
      items: [
        { title: "Doanh Thu", href: "/reports/revenue", icon: TrendingUp },
        { title: "Chi Phí", href: "/reports/expenses", icon: PieChart },
        { title: "Lợi Nhuận", href: "/reports/profit", icon: BarChart3 },
        { title: "Dòng Tiền", href: "/reports/cash-flow", icon: Activity },
        { title: "Theo Khách Hàng", href: "/reports/by-customer", icon: Users },
        { title: "Theo Dịch Vụ", href: "/reports/by-service", icon: Package },
      ]
    },
    {
      title: "Danh Mục",
      items: [
        { title: "Khách Hàng", href: "/customers", icon: Users },
        { title: "Nhà Cung Cấp", href: "/suppliers", icon: Building2 },
        { title: "Dịch Vụ", href: "/services", icon: Briefcase },
        { title: "Hợp Đồng", href: "/contracts", icon: FileText },
        { title: "Nhân Viên", href: "/employees", icon: User },
        { title: "Công Nợ", href: "/debts", icon: FileDollar },
      ]
    },
    {
      title: "Hệ Thống",
      items: [
        { title: "Nhật Ký", href: "/audit-logs", icon: Activity },
      ]
    }
  ];

  return (
    <SidebarComponent className="border-r shadow-sm">
      <SidebarHeader className="p-4 flex items-center justify-center border-b border-sidebar-border/50">
        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 90 L15 30 L35 55 L35 90 Z" fill="white" />
              <path d="M35 90 L35 55 L50 35 L65 55 L65 90 Z" fill="white" />
              <path d="M65 90 L65 30 L85 90 Z" fill="white" />
              <path d="M40 45 L55 25 L70 45" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="40" cy="45" r="4" fill="white" />
              <circle cx="55" cy="25" r="4" fill="white" />
              <circle cx="70" cy="45" r="4" fill="white" />
            </svg>
          </div>
          <span>Phá ERP</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        {navGroups.map((group, idx) => (
          <SidebarGroup key={idx} className="mb-2">
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={cn(
                          "transition-colors",
                          isActive ? "font-medium" : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border/50 text-xs text-sidebar-foreground/40 text-center">
        Bứt Phá Marketing © {new Date().getFullYear()}
      </SidebarFooter>
    </SidebarComponent>
  );
}
