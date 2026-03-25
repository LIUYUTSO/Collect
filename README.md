# Collect · Simple Requests

> **"A simple, quiet payment request experience."**

`Collect` is a premium billing tool designed for individuals and groups. It discards the complexity and noise of traditional financial applications, adopting a minimalist design language inspired by Japanese "Washi" paper and "Sumi" ink, providing an elegant and tactile billing experience.

## ✨ Core Features

### 🖨️ Receipt Animation
When a recipient opens the link, the system simulates a physical receipt printing process. Powered by **GSAP**, the receipt gracefully slides out from the top "printer slot" with a digital stopwatch-style counter animation.

### 🍱 Bill Consolidation
If you have multiple pending requests for the same person, `Collect` automatically consolidates them into a single list. Recipients only need to open one link to see all outstanding items, eliminating the need to toggle between messages.

### 🎨 Design Aesthetics
- **Washi (#F2EDE4)** as the background and **Sumi (#1A1714)** as the primary text color.
- **Magnetic Effects** and smooth **Reveal Animations** for an interactive feel.
- **Zen Old Mincho** and **DM Mono** typography for a refined look.

### 💳 Debt Attribution
- **Pay to Labels**: Clearly marks who each item should be paid to (e.g., `pay to Adam`).
- **Payment Guidance**: Integrated quick-jump for payment channels like Wealthsimple and TD, shortening the path from "View" to "Paid".

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS
- **Animations**: [GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/)

### Backend & Data
- **Database**: [Vercel Postgres (PostgreSQL)](https://vercel.com/storage/postgres)
- **Engine**: `db.ts` (Raw SQL encapsulation for maximum performance)

---

## 📂 Project Structure
```text
├── app/
│   ├── dashboard/          # Admin Portal: Manage requests, contacts, and login
│   ├── request/[slug]/     # Dynamic Request Page: Receipt animations and consolidation logic
│   └── api/                # Backend API endpoints (Auth, Payees, Requests)
├── components/             # Reusable UI components
├── lib/                    # Core logic and database utilities
└── public/                 # Static assets and manifest files
```

---

## 📜 License
This project is for private use, with all rights reserved by **ADAM LIU**.

---
