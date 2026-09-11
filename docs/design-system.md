# **Design System** 

Productivity SaaS Dashboard — AI Implementation Guide 

Dokumen ini dibuat berdasarkan screenshot referensi yang diberikan. Gunakan sebagai sumber kebenaran visual (visual source of truth) ketika AI coding agent membangun halaman atau komponen baru. 

## **1. Design Direction** 

- Clean, minimal, professional, calm, lightweight, spacious. 

- Productivity-oriented SaaS dashboard dengan visual hierarchy yang kuat. 

- Prioritaskan usability dan information hierarchy daripada dekorasi. 

- Hindari excessive gradients, shadows, borders, colors, animations, dan glassmorphism. 

- Jika ragu, pilih solusi visual yang lebih sederhana. 

## **2. Color System** 

### **Brand** 

|**Token**|**Hex**|**Penggunaan**|
|---|---|---|
|Primary 500|#3B82F6|Primary action, progress, active state|
|Primary 600|#2563EB|Hover primary button|
|Primary 700|#1D4ED8|Active/pressed state|
|Primary 400|#60A5FA|Accent ringan|
|Primary 300|#93C5FD|Checkbox/border ringan|
|Primary 100|#DBEAFE|Selected/background|
|Primary 50|#EFF6FF|Active navigation/background|



### **Background, Surface, Text & Border** 

|**Token**|**Hex**|
|---|---|
|Background|#F7FAFC|
|Background Cool|#EEF7FF|
|Surface|#FFFFFF|
|Surface Secondary|#FAFBFC|
|Text Primary|#111827|
|Text Secondary|#4B5563|
|Text Muted|#6B7280|
|Text Placeholder|#9CA3AF|



Design System — Productivity SaaS Dashboard 

Page 1 

|**Token**|**Hex**|
|---|---|
|Border|#E5E7EB|
|Border Light|#F0F2F5|
|Border Strong|#D1D5DB|



### **Status** 

- Success: #22C55E / #DCFCE7 / #15803D 

- Warning: #F59E0B / #FEF3C7 / #B45309 

- Error: #EF4444 / #FEE2E2 / #B91C1C 

- Info: #3B82F6 / #DBEAFE / #1D4ED8 

## **3. Typography** 

- Primary font: Inter. 

- Fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. 

|**Level**|**Size / Line Height**|**Weight**|**Usage**|
|---|---|---|---|
|Display|32 / 40 px|600|Large metrics|
|H1|24 / 32 px|600|Page heading|
|H2|20 / 28 px|600|Section heading|
|H3|16 / 24 px|600|Card/task title|
|Body|14 / 20 px|400|Default text|
|Small|12 / 16 px|400|Metadata/helper text|
|Button|14 / 20 px|500|Button labels|



- Gunakan terutama weight 400, 500, dan 600. Hindari bold berlebihan. 

## **4. Spacing & Radius** 

- Spacing: gunakan base 4px — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. 

- Card padding: 20px. 

- Default page gap: 24px. 

- Buttons/inputs: radius 8px. 

- Cards/panels: radius 12px. 

- Modal: radius 16px. 

- Avatar/badge: fully rounded. 

## **5. Shadows & Elevation** 

Card: 0 1px 3px rgba(15, 23, 42, 0.04) Elevated: 0 4px 12px rgba(15, 23, 42, 0.06) Modal/dropdown: 0 10px 30px rgba(15, 23, 42, 0.10) 

- Prefer subtle borders over strong shadows. 

Design System — Productivity SaaS Dashboard 

Page 2 

## **6. Layout** 

- Dashboard terdiri dari sidebar + header + main content. 

- Desktop sidebar sekitar 220–240px; main content fleksibel. 

- Page padding sekitar 20–32px. 

- Desktop menggunakan multi-column layout; mobile berubah menjadi single column. 

- Jangan pernah menyebabkan horizontal page scrolling. 

Desktop 

┌──────────────┬──────────────────────────────┐ │ Sidebar │ Header │ │ ├──────────────────────────────┤ │ │ Main Content │ └──────────────┴──────────────────────────────┘ 

## **7. Sidebar** 

- White background dengan thin right border. 

- Navigation compact dengan icon 16–20px. 

- Active item: background #EFF6FF, text/icon #3B82F6. 

- Inactive item: #4B5563. 

- Hover: #F8FAFC. 

- Section labels seperti MENU/PROJECTS/OTHERS: 11px, weight 500, #9CA3AF. 

## **8. Header** 

- Header bersih dan compact, sekitar 64–72px. 

- Typical elements: page title, search, notification, avatar, profile menu. 

- Search: height 40px, white background, border #E5E7EB, radius 8px. 

## **9. Cards** 

background: #FFFFFF border: 1px solid #E5E7EB border-radius: 12px padding: 20px 

- Card harus memiliki hierarchy: header → content → optional footer. 

## **10. Buttons** 

### **Primary** 

- Background #3B82F6, white text, radius 8px, weight 500. 

- Hover #2563EB; active #1D4ED8. 

### **Secondary** 

- White background, #374151 text, 1px #E5E7EB border, radius 8px. 

### **Ghost** 

Design System — Productivity SaaS Dashboard 

Page 3 

- Transparent background, #4B5563 text; hover background #F3F4F6. 

## **11. Inputs** 

height: 40px padding: 0 12px border: 1px solid #E5E7EB border-radius: 8px background: #FFFFFF font-size: 14px 

- Focus border #3B82F6 dengan subtle blue focus ring. 

- Placeholder menggunakan #9CA3AF. 

## **12. Task List** 

- Task row: circular checkbox + title + metadata + action menu. 

- Title: 14px / weight 500 / #111827. 

- Metadata: 12px / #6B7280. 

- Completed: line-through + #9CA3AF. 

- Hover row: #F8FAFC. 

## **13. Checkbox & Progress** 

- Task checkbox: circular, sekitar 20px, border #93C5FD. 

- Checked checkbox: #3B82F6 dengan border yang sama. 

- Progress track: #E5E7EB, height sekitar 10px, fully rounded. 

- Progress fill: #3B82F6, fully rounded. 

## **14. Tabs** 

- Tab container: #F8FAFC, radius 8px. 

- Active tab: #3B82F6 background + white text. 

- Inactive tab: transparent + #374151. 

## **15. Pomodoro Timer** 

- Timer adalah visual focal point. 

- Ring: primary #3B82F6; track #EEF2F7. 

- Timer number: 56–64px, weight 400, #111827. 

- Controls berada di bawah timer. 

- Primary control menggunakan primary blue; reset/skip menjadi secondary controls. 

## **16. Icons** 

- Gunakan Lucide Icons. 

- Default icon size: 18px; range 16–20px. 

- Default icon color: #6B7280. 

Design System — Productivity SaaS Dashboard 

Page 4 

- Active icon: #3B82F6. 

- Jangan menggunakan icon hanya sebagai dekorasi jika tidak memberi informasi/affordance. 

## **17. Interaction & Animation** 

- Default transition 150–200ms. 

- Gunakan transition-colors, transition-opacity, transition-transform bila diperlukan. 

- Hover state harus subtle. 

- Hindari bounce, excessive spring animation, dan scale besar. 

## **18. Responsive** 

|**Breakpoint**|**Behavior**|
|---|---|
|< 768px|Single column, sidebar menjadi drawer/bottom navigation|
|768–1024px|Compact sidebar dan two-column bila ruang cukup|
|>= 1024px|Full dashboard layout|



## **19. Tailwind Mapping** 

Primary: blue-500 / blue-600 / blue-700 Background: slate-50 / white Text: slate-900 / slate-700 / slate-500 / slate-400 Border: slate-200 / slate-100 Success: green-500 Warning: amber-500 Error: red-500 

Prefer semantic design tokens. Avoid excessive arbitrary values such as bg-[#xxxxxx] unless a precise token is required. 

## **20. AI Design Rules** 

- 1. Gunakan white cards pada very light cool-gray/blue page background. 

- 2. Gunakan blue sebagai primary accent. 

- 3. Gunakan dark gray untuk primary text dan muted gray untuk secondary text. 

- 4. Gunakan thin borders daripada strong shadows. 

- 5. Gunakan radius 8–12px untuk sebagian besar komponen. 

- 6. Gunakan 20px card padding dan 4px spacing system. 

- 7. Gunakan Inter/system sans-serif. 

- 8. Jaga typography compact dan profesional. 

- 9. Hindari excessive decoration dan gradients. 

- 10. Hindari excessive pill-shaped UI. 

- 11. Gunakan Lucide Icons. 

- 12. Jangan memperkenalkan warna random di luar design tokens. 

- 13. Reuse komponen yang sudah ada daripada membuat variant visual yang berbeda. 

Design System — Productivity SaaS Dashboard 

Page 5 

- 14. Pertahankan alignment dan spacing antar-card. 

- 15. Jika tidak yakin, pilih solusi yang paling sederhana dan konsisten. 

## **21. Visual Formula** 

Light Cool Background + White Surfaces + Blue Primary Accent + Dark Gray Typography + Subtle Gray Borders + Small Shadows + 8–12px Radius + 4px Spacing System + Inter Typography = Modern Productivity SaaS UI 

## **22. Recommended AI Project Structure** 

my-project/ ├── AGENTS.md ├── PRD.md ├── DESIGN.md ├── app/ ├── components/ ├── lib/ ├── hooks/ ├── types/ └── supabase/ 

- PRD.md: apa yang harus dibuat. 

- DESIGN.md: bagaimana tampilannya. 

- AGENTS.md: bagaimana AI harus bekerja di repository. 

- skills/: cara melakukan pekerjaan tertentu. 

- MCP: tool/data eksternal yang boleh diakses AI. 

Catatan: font Inter dipilih sebagai rekomendasi visual berdasarkan karakter screenshot; font asli tidak dapat dipastikan 100% hanya dari screenshot.

Design System — Productivity SaaS Dashboard 

Page 6 

## **23. Dark Mode** 

Referensi palette: **Askk AI / Stellar UI** (dark theme). Implementasi menggunakan `next-themes` dengan class strategy (`attribute="class"`), default mengikuti sistem OS (`system`), dan toggle tersedia di **sidebar** serta **halaman Settings**.

### **23.1 Color Tokens — Dark**

|**Token**|**Hex**|**Penggunaan**|
|---|---|---|
|`--bg-base`|#111213|Background utama workspace|
|`--bg-surface`|#1c1d1f|Card, sidebar, panel|
|`--bg-elevated`|#242628|Hover state, input background|
|`--bg-overlay`|#2a2c2f|Modal, dropdown|
|`--border`|#2e3033|Border halus antar elemen|
|`--border-strong`|#3a3d42|Border aktif / focused|

|**Token (Text)**|**Hex**|**Penggunaan**|
|---|---|---|
|`--text-primary`|#e8eaed|Judul, teks utama|
|`--text-secondary`|#9aa0a6|Subtitle, label, placeholder|
|`--text-muted`|#5f6368|Teks tidak aktif, timestamp|
|`--text-inverse`|#111213|Teks di atas tombol terang|

|**Token (Accent)**|**Hex**|**Penggunaan**|
|---|---|---|
|`--accent-primary`|#3B82F6|Primary button, link aktif — konsisten dengan light mode|
|`--accent-primary-hover`|#2563EB|Hover primary button|
|`--accent-primary-subtle`|rgba(59, 130, 246, 0.12)|Background subtle accent|

### **23.2 Semantic — Dark**

|**Token**|**Hex**|
|---|---|
|Success|#34a853|
|Warning|#fbbc04|
|Error|#ea4335|
|Info|#4285f4|

### **23.3 Shadow — Dark**

Gunakan shadow dengan opacity lebih tinggi di dark mode karena kontras lebih rendah.

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.4);
--shadow-md:  0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.6);
--shadow-glow: 0 0 16px rgba(59,130,246,0.25);
```

### **23.4 Implementasi di POS App**

Dark mode diaktifkan dengan class `.dark` pada `<html>`. Semua warna text/border/background yang **sudah token-based** (mis. `text-text-primary`, `bg-surface`, `border-border`) otomatis menyesuaikan karena token CSS variable di-override di blok `.dark`.

```css
:root {
  --bg-base: #111213;
  --bg-surface: #1c1d1f;
  --text-primary: #e8eaed;
  --accent-primary: #3b82f6;
  /* dst. */
}

.dark {
  /* override token di sini */
}
```

### **23.5 Aturan Dark Mode**

**✅ Do**
- Gunakan `--bg-surface` untuk sidebar dan card agar berbeda dari `--bg-base` (background utama).
- Berikan border `1px solid --border` pada elemen yang perlu separasi visual — di dark mode border lebih penting daripada shadow.
- Text-secondary untuk label/meta; text-primary untuk judul dan teks utama.
- Jaga konsistensi accent `--accent-primary` (#3B82F6) untuk elemen aktif/primary — sama di light dan dark mode.

**❌ Don't**
- Jangan gunakan `#000000` pure black sebagai background — terlalu harsh untuk dashboard.
- Jangan gunakan warna terang light theme yang tidak di-token (mis. `bg-white`, `text-gray-800`) di dalam komponen — ganti dengan token `bg-surface`, `text-text-primary`, dll.
- Jangan gunakan shadow kuat di semua elemen — hanya modal dan dropdown.
- Jangan ubah hue accent saat dark mode (mis. biru → ungu) — gunakan `--color-primary` yang sudah konsisten (#3B82F6).

### **23.6 Tailwind Mapping — Dark**

- Background: `bg-base` / `bg-surface` / `bg-elevated` / `bg-overlay` (di-expose sebagai `--color-*`).
- Text: `text-text-primary` / `text-text-secondary` / `text-text-muted`.
- Border: `border-border` / `border-border-strong`.
- Accent: `bg-primary` (konsisten #3B82F6 di light & dark).

Design System — Productivity SaaS Dashboard 

Page 7

