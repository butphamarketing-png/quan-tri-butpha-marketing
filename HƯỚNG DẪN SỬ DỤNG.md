# Hướng Dẫn Sử Dụng Phá ERP - Asset Tracker

## Giới Thiệu Về Phần Mềm

Phá ERP là phần mềm quản lý tài sản, doanh thu, chi phí và khách hàng dành cho các doanh nghiệp marketing. Phần mềm giúp bạn quản lý toàn bộ chu trình kinh doanh từ khách hàng, hợp đồng, dịch vụ đến tài chính và báo cáo.

### Cấu Trúc Dự Án

```
Asset-Tracker/
├── artifacts/
│   ├── api-server/   → Backend API (Node.js + Express)
│   └── erp/          → Frontend (React + Vite)
├── lib/
│   ├── api-zod/      → Schema API
│   ├── api-spec/     → OpenAPI Spec
│   └── db/           → Database Schema (Prisma + Drizzle)
└── pnpm-workspace.yaml → Monorepo Config
```

## Các Chức Năng Chính

### 1. Tổng Quan (Dashboard)
Xem nhanh các số liệu chính về doanh thu, chi phí, lợi nhuận.

### 2. Tài Chính
- **Phiếu Thu**: Quản lý các khoản thu tiền
- **Phiếu Chi**: Quản lý các khoản chi tiền
- **Công Nợ Phải Thu**: Theo dõi nợ khách hàng cần thu về
- **Công Nợ Phải Trả**: Theo dõi nợ cần trả cho nhà cung cấp

### 3. Báo Cáo
- **Doanh Thu**: Báo cáo doanh thu theo thời gian
- **Chi Phí**: Báo cáo chi phí theo thời gian
- **Lợi Nhuận**: Báo cáo lợi nhuận
- **Dòng Tiền**: Báo cáo dòng tiền
- **Theo Khách Hàng**: Báo cáo theo từng khách hàng
- **Theo Dịch Vụ**: Báo cáo theo từng dịch vụ

### 4. Danh Mục
- **Khách Hàng**: Quản lý thông tin khách hàng
- **Nhà Cung Cấp**: Quản lý thông tin nhà cung cấp
- **Dịch Vụ**: Quản lý các dịch vụ cung cấp
- **Hợp Đồng**: Quản lý hợp đồng với khách hàng

### 5. Tài Sản Marketing
- **Domains**: Quản lý tên miền
- **Hostings**: Quản lý hosting
- **Websites**: Quản lý website
- **Fanpages**: Quản lý fanpage Facebook
- **Dịch Vụ Fanpage**: Quản lý dịch vụ fanpage
- **Facebook Ads**: Quản lý chiến dịch Facebook Ads
- **Google Ads**: Quản lý chiến dịch Google Ads
- **Google Profiles**: Quản lý profile Google

### 6. Hệ Thống
- **Nhật Ký Hoạt Động**: Xem lịch sử hoạt động của người dùng

## Cách Khởi Chạy Phần Mềm

### Yêu Cầu Hệ Thống
- Node.js (phiên bản mới nhất)
- pnpm (package manager)
- PostgreSQL hoặc Supabase

### Cài Đặt Local

1. Clone dự án
2. Vào thư mục dự án: `cd Asset-Tracker`
3. Cài đặt dependencies: `pnpm install`
4. Cấu hình database (file `lib/db/.env`):
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
   ```
5. Chạy migration để tạo bảng:
   ```bash
   cd lib/db
   pnpm db:push
   ```
6. Khởi chạy backend:
   ```bash
   cd artifacts/api-server
   pnpm dev
   ```
7. Khởi chạy frontend:
   ```bash
   cd artifacts/erp
   pnpm dev
   ```

## Triển Khai Lên Vercel

1. Đăng nhập Vercel
2. Import repository GitHub
3. Chọn Root Directory: `/` (thư mục gốc)
4. Thêm Environment Variables:
   - `DATABASE_URL`: URL kết nối database Supabase
   - `JWT_SECRET`: Mã bí mật để tạo token
5. Nhấn **Deploy**

## Công Nghệ Sử Dụng

- **Frontend**: React 19, Vite, TailwindCSS, shadcn/ui, Wouter, TanStack Query
- **Backend**: Node.js, Express, Drizzle ORM, Prisma
- **Database**: PostgreSQL (Supabase)
- **Build**: pnpm Monorepo, Esbuild
