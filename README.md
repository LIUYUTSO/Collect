# 請款 · Collect

> 簡約的個人收款 App，侘寂美學設計。

A minimal, Wabi-Sabi styled payment request app for collecting money from friends via **TD Interac e-Transfer** or **WealthSimple Interac**.

---

## Features

- 📱 Mobile-first, PWA-ready
- 🗂 Backend database (PostgreSQL via Prisma)
- 🔐 Password-protected admin dashboard
- 🔗 Shareable payment request links
- ✅ Mark requests as paid/unpaid
- 💴 TD & WealthSimple Interac support
- 🎌 Wabi-Sabi aesthetic design

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| ORM | Prisma |
| Database | PostgreSQL (Neon / Supabase) |
| Hosting | Vercel |
| Styling | Tailwind CSS + inline styles |

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/collect-app.git
cd collect-app
npm install
```

### 2. Database

Create a free PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).

Copy the connection string.

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://..."

# Admin password (to access /dashboard)
ADMIN_PASSWORD="your-secret-password"

# Your TD Interac email
TD_EMAIL="you@example.com"

# Your WealthSimple handle/email
WS_HANDLE="you@wealthsimple.com"

# Your name shown to friends
YOUR_NAME="Your Name"
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Using Vercel CLI (Antigravity / local)

```bash
npm i -g vercel
vercel login
vercel
```

### Using Vercel Dashboard

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add all environment variables in Vercel dashboard
5. Deploy ✓

---

## Usage

### Create a Request

1. Go to `/dashboard`
2. Enter your admin password
3. Click **+ 新增**
4. Fill in: title, amount, method (TD or WealthSimple)
5. Copy the generated link and send to your friend

### Friend's View

Your friend opens the link and sees:
- Amount owed
- Your Interac email/handle
- Instructions to transfer

### Mark as Paid

Back in `/dashboard`, tap **標記已收** when the money arrives.

---

## File Structure

```
collect-app/
├── app/
│   ├── api/requests/       # REST API routes
│   ├── dashboard/          # Admin dashboard (password protected)
│   ├── request/[slug]/     # Public payment page for friends
│   └── globals.css         # Wabi-sabi styles
├── lib/
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Formatting helpers
├── prisma/
│   └── schema.prisma       # Database schema
└── vercel.json             # Vercel config
```

---

## Design Philosophy

The UI follows **侘寂 (Wabi-Sabi)** — finding beauty in imperfection and transience:

- Washi paper texture background
- Ink brush dividers
- Zen Old Mincho serif typography
- Muted earth tones (ash, clay, rust, moss)
- Generous negative space
- Subtle grain overlay

---

## License

Personal use.
