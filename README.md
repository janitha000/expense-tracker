# BudgetFlow - Responsive Mobile-First Expense Tracker PWA

A responsive, mobile-first **Personal Expense & Budget Tracker Progressive Web App (PWA)** built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Drizzle ORM** (targeting **Neon Serverless PostgreSQL**), **Recharts**, and PWA offline & installability features, ready for 1-click deployment on **Vercel**.

![BudgetFlow Banner](/icons/icon.svg)

---

## 🌟 Key Features

### 1. Daily Expense Entry (Quick Action)
- Prominent floating action button (`+`) optimized for mobile thumb reach.
- Rapid input modal: Amount, Date shortcuts ("Today", "Yesterday"), Category selector with Lucide icon badges & hex swatches, Parent Type selector (`Normal` vs `One-Time`), and optional Notes.
- Instant validation via **Zod** with helpful error feedback.

### 2. Normal vs. One-Time Expense Isolation
- **Normal Expenses**: Recurring, baseline living expenses (Rent, Groceries, Utilities, Transit).
- **One-Time Expenses**: Discretionary or unexpected one-off purchases (Electronics, Concert tickets, Vacation, Auto repairs).
- All analytics, charts, and KPI cards isolate this distinction to prevent discretionary spikes from skewing baseline run-rates.

### 3. Analytics & Visualization Dashboard
- **KPI Summary Cards**:
  - **Total Spend** (Current Month) & Daily Average.
  - **Normal vs. Baseline Budget**: Visual progress bar tracking spending against the monthly baseline budget limit.
  - **One-Time Expenses Total**: Discretionary total with percentage share of total spending.
  - **Month-over-Month (MoM) % Change**: Trend indicator comparing against the previous month.
- **Category Donut Chart (Recharts)**:
  - Spending breakdown with an interactive segment toggle: `All`, `Only Normal`, or `Only One-Time`.
- **6-Month Stacked Bar Chart**:
  - Compares the last 6 months, stacking `Normal` (base bar) and `One-Time` (top bar) to show what caused monthly spending spikes.
- **Daily Cumulative Burn Rate (Area Chart)**:
  - Plots Normal daily run-rate vs Total spend against an ideal linear budget benchmark trajectory.

### 4. Grouped Chronological Expense List
- Chronological grouping by day with daily subtotals.
- Visual badges distinguishing **Normal** (neutral badge) from **One-Time** (vibrant amber badge with sparkle).
- Quick filters: Switch between Months, Filter by Parent Type (`All`, `Normal`, `One-Time`), Category dropdown, and live search.
- Inline actions: Edit and Delete with confirmation modal.

### 5. Category Management
- Manage default categories and create custom categories.
- Interactive color picker with 16 accessible palette colors.
- Searchable icon picker with 30+ popular Lucide icons.

### 6. PWA & Mobile Viewport
- Configured with `public/manifest.json` and `app/manifest.ts` for standalone installation.
- Mobile viewport settings: `viewportFit: 'cover'`, preventing pinch-zoom layout shifts on mobile Safari and Chrome.
- Offline static caching with `public/sw.js` Service Worker.
- In-app PWA install prompt banner for iOS and Android.

---

## 🛠️ Tech Stack & Infrastructure

- **Framework**: Next.js 16 (App Router, Server Actions, React 19, TypeScript)
- **Styling**: Tailwind CSS, Lucide React icons
- **Database & ORM**: PostgreSQL via **Neon Serverless** using **Drizzle ORM** & `@neondatabase/serverless`
- **Charts**: Recharts
- **Validation**: Zod
- **Date Utilities**: Date-fns
- **Effects**: Canvas Confetti

---

## 🚀 Quick Start (Local Development)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

> [!NOTE]
> If `DATABASE_URL` is left empty, the application automatically runs in **Demo Mode** with a pre-seeded in-memory store containing 6 months of sample expense data.

### 3. Connect Neon PostgreSQL (Optional)
To connect to your live Neon database, add your connection string to `.env.local`:
```env
DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Push the Drizzle schema and seed the database:
```bash
npm run db:push
npm run db:seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Generate SQL migrations in `./drizzle` folder |
| `npm run db:push` | Push schema directly to Neon PostgreSQL |
| `npm run db:seed` | Seed default categories and 6 months of sample data |
| `npm run build` | Build production Next.js PWA bundle |

---

## ☁️ Deploy to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into **Vercel**.
3. In the Vercel Project Settings, add the Environment Variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
4. Deploy!
