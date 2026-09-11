<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project

POS (point-of-sale) app — Next.js 16.3.4 (Turbopack), React 19, TypeScript, Tailwind CSS v4, App Router. No ESLint or test runner installed.

## Commands (Windows gotchas)

- **Never call `npm`/`npx` directly** — PowerShell execution policy blocks their `.ps1` shims. Always use the `.cmd` variants:
  - `& "C:\Program Files\nodejs\npm.cmd" run dev`
  - `& "C:\Program Files\nodejs\npx.cmd" <cmd>`
- `npm run dev` / `npm run build` / `npm run start` are the only scripts (package.json). No lint/typecheck/test scripts — `next build` runs TypeScript checks.
- `npm run dev` regenerates the `AGENTS.md` header block above; don't be surprised if it reappears after removal.

## Structure

- App Router but **no `src/` dir** — routes live in `app/` at the repo root.
- `next.config.ts`, `postcss.config.mjs`, `tsconfig.json` at root. Tailwind v4 is configured via PostCSS (no `tailwind.config.*` file).
- TypeScript uses the `@/*` import alias.

## Gotchas

- Folder is named `POS` (uppercase) — `create-next-app` in this directory fails because npm forbids capital letters in package names. The package is named `pos`; scaffold new Next.js projects in a lowercase-named temp dir and move files over.
- This is Next.js 16, not the version in your training data — read `node_modules/next/dist/docs/` before writing code (see header block).

## Stack

- Installed: Next.js (App Router), TypeScript (strict), Tailwind CSS v4
- Planned (belum ada di package.json): Supabase, TanStack Query, Zod — rules di bawah ini berlaku begitu dependencies ditambahkan.

## Code Rules

- Use TypeScript strictly; avoid `any`
- Reuse existing components; jangan duplikasi business logic
- Prefer server-side authorization; validate input dengan Zod

## Data Fetching

- Server state pakai TanStack Query
- Query keys harus terpusat
- Mutation harus invalidate query terkait

## Supabase

- Jangan pernah expose service role key (server-only)
- Respect RLS; authorization tidak boleh hanya di frontend

## Git Workflow

- **JANGAN pernah commit, push, atau merge ke `development` / `main` sendiri.**
- Push/merge ke `development` atau `main` HANYA dilakukan setelah user **secara eksplisit memerintah** ("push sekarang", "merge ke main", dll.) + **konfirmasi final** dari user.
- Default: kerjakan perubahan lokal tanpa push; tunggu instruksi.
- Sebelum push: verifikasi tidak ada file `.env*`, secret, atau key yang ikut ter-stage.
- Jika ingin push tapi belum diperintah → TANYA dulu, jangan dieksekusi.

## Workflow

Sebelum implementasi fitur:

1. Baca docs (`node_modules/next/dist/docs/`)
2. Inspeksi kode yang ada
3. Reuse pattern yang ada
4. Implementasi minimal
5. Type check via `npm run build` (tidak ada script lint)
6. Bereskan error

## Pencatatan Hasil (wajib)

- Setelah SETIAP prompt/tugas selesai, catat ringkasan perubahan ke `docs/prompt-log.md`.
- **Append-only:** hanya tambahkan entri baru di PALING BAWAH file. JANGAN pernah menghapus, mengedit, atau memadatkan entri lama.
- Format entri & contoh: lihat skill `append-notes`.

## Do Not

- Refactor file yang tidak terkait
- Tambah library yang tidak perlu
- Pakai `any`
- Bypass RLS
- Bocorkan `.env` / expose key di client
- Push/merge ke `development` / `main` tanpa perintah & konfirmasi eksplisit dari user
