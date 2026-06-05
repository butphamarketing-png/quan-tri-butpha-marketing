import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "Hoạt động", className: "bg-green-100 text-green-800" },
  inactive: { label: "Ngừng hoạt động", className: "bg-gray-100 text-gray-700" },
  completed: { label: "Hoàn thành", className: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
  draft: { label: "Nháp", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", className: "bg-green-100 text-green-800" },
  paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
  unpaid: { label: "Chưa thanh toán", className: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "Quá hạn", className: "bg-red-100 text-red-800" },
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800" },
  digital: { label: "Kỹ thuật số", className: "bg-blue-100 text-blue-800" },
  creative: { label: "Sáng tạo", className: "bg-purple-100 text-purple-800" },
  consulting: { label: "Tư vấn", className: "bg-indigo-100 text-indigo-800" },
  event: { label: "Sự kiện", className: "bg-pink-100 text-pink-800" },
  printing: { label: "In ấn", className: "bg-orange-100 text-orange-800" },
  // expense categories
  salary: { label: "Nhân sự", className: "bg-purple-100 text-purple-800" },
  media: { label: "Truyền thông", className: "bg-blue-100 text-blue-800" },
  office: { label: "Văn phòng", className: "bg-gray-100 text-gray-700" },
  software: { label: "Phần mềm", className: "bg-cyan-100 text-cyan-800" },
  travel: { label: "Di chuyển", className: "bg-yellow-100 text-yellow-800" },
  other: { label: "Khác", className: "bg-gray-100 text-gray-700" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const info = statusMap[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", info.className)}>
      {info.label}
    </span>
  );
}
