---
name: Orval Zod index re-export
description: api-zod/src/index.ts must only export from ./generated/api to avoid TS2308 naming conflicts
---

The api-zod lib's `src/index.ts` must be exactly:
```ts
export * from "./generated/api";
```

Do NOT include `export * from "./generated/types"` or `export type * from "./generated/types"`.

**Why:** Orval generates Zod schema constants (e.g. `export const LoginAuthBody = zod.object(...)`) in `api.ts` AND TypeScript types (e.g. `export type LoginAuthBody = {...}`) in the `types/` directory. When index.ts re-exports both with `export *`, TypeScript raises TS2308 (ambiguous re-export) even for `export type *`. The Zod schemas are sufficient — types can be derived with `z.infer<typeof ...>` or imported from `@workspace/api-client-react`.

**How to apply:** After any Orval codegen run that adds new operations, check that index.ts still only exports from `./generated/api`. The codegen script itself does not regenerate index.ts.
