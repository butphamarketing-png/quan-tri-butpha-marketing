# Bứt Phá Marketing ERP

A full-stack internal Marketing Agency ERP for Vietnamese agency Bứt Phá — managing financial operations, customer/supplier data, contracts, and reporting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Wouter routing, Recharts, Tailwind CSS v4, shadcn/ui
- Language: Vietnamese (vi-VN)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (customers, services, suppliers, contracts, receipts, expenses, audit-logs)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks
- `lib/api-zod/src/generated/` — Orval-generated Zod validators
- `artifacts/api-server/src/routes/` — Express route handlers (one file per entity)
- `artifacts/erp/src/pages/` — All frontend pages
- `artifacts/erp/src/components/` — Layout (Sidebar, Layout) + shared UI components

## Architecture decisions

- Contract-first API design: OpenAPI spec → codegen → Zod validators + React Query hooks
- All monetary values stored as PostgreSQL `numeric` (string in JS), cast to `number` in route enrichment
- Express 5: all route handlers must `return res.*()` — TS7030 fires without explicit return
- Date columns use Drizzle `date` mode `"string"` (ISO `YYYY-MM-DD`); Zod params may emit `Date`, wrap with `String()`
- Audit logging is fire-and-forget (catches errors silently) to avoid breaking main operations

## Product

- **Phiếu Thu / Phiếu Chi** — Full CRUD for receipts and expenses with auto-generated codes (PT-xxxx / PC-xxxx)
- **Công Nợ Phải Thu / Trả** — AR/AP views derived from contract vs payment data
- **Hợp Đồng** — Contract management linked to customers and services; tracks paid vs remaining value
- **Báo Cáo** — Revenue, expense, profit, cash flow, by-customer, by-service reports with charts
- **Dashboard** — KPI cards + 12-month area chart + recent activity
- **Danh Mục** — Customers, Suppliers, Services master data
- **Nhật Ký** — Full audit log of all create/update/delete operations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — stale lib declarations cause phantom TS2305 errors
- Do NOT run `pnpm dev` at workspace root — individual workflows handle PORT + BASE_PATH
- Express 5 requires `return res.*()` in all branches of async handlers (TS7030)
- Drizzle date columns typed as `mode: "string"` need `String()` coercion when using Zod-parsed date params

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
