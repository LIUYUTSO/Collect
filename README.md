# Collect · 靜謐請款

> **「簡單、安靜的請款體驗。」**
> *Simple, quiet payment requests.*

`Collect` 是一個專為個人與小組設計的精品請款工具。它拋棄了傳統財務應用的繁瑣與嘈雜，採用受日本「和紙 (Washi)」與「墨 (Sumi)」啟動的極簡設計語法，提供極致流暢、優雅且具備物理質感的請款體驗。

![專案預覽](https://collect.adamliu.uk/assets/og-image.png) *(示意圖，需實際路徑)*

## ✨ 核心特色

### 🖨️ 沉浸式實體收據動畫
當收款人打開連結時，系統會模擬真實收據打印過程。配合 **GSAP** 強大的物理引擎，收據會從頂部「出紙口」優雅滑出，並伴隨數位跑錶式的動態數位增長。

### 🍱 智慧帳單合併 (Consolidation)
如果您對同一位朋友有多筆零散的請款，`Collect` 會自動將它們整合在一張清單中。受款人只需點開任一連結，即可一次查看所有待結算項目，無需頻繁切換。

### 🎨 極致設計美學
-  `Washi (#F2EDE4)` 作為背景與 `Sumi (#1A1714)` 作為主要文字色彩。
-  具備「磁吸效應 (Magnetic Effect)」，清單展開則使用流暢的 Reveal 動畫。
-  `Zen Old Mincho` 與 `DM Mono` 

### 💳 清晰的債務歸屬
- **Pay to 標記**：在合併帳單中，清晰標註每一筆項目應付給誰（例如：`pay to Adam`）。
- **付款引導**：整合 Wealthsimple 與 TD 等支付渠道的快速跳轉，縮短從「查看」到「付清」的距離。

---

## 🛠️ 技術棧 (Tech Stack)

### 前端
- **框架**：[Next.js 16 (App Router)](https://nextjs.org/)
- **語言**：TypeScript
- **樣式**：Tailwind CSS / Styled-jsx
- **動畫**：[GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/)

### 後端與數據
- **資料庫**：[Vercel Postgres (PostgreSQL)](https://vercel.com/storage/postgres)
- **工具**：`db.ts` (純 SQL 封裝，極致性能)

---

## 🚀 快速開始

### 1. 克隆專案
```bash
git clone https://github.com/LIUYUTSO/Collect.git
cd collect_app
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境變數配置
在根目錄創建 `.env.local` 並填入您的 Vercel Postgres 連接資訊與基礎網域：
```env
POSTGRES_URL=your_postgres_url
NEXT_PUBLIC_BASE_URL=https://collect.adamliu.uk
```

### 4. 啟動開發伺服器
```bash
npm run dev
```

---

## 📂 專案結構
```text
├── app/
│   ├── dashboard/          # 主控台：管理請求、聯繫人與登入
│   ├── request/[slug]/     # 動態請款頁：實體收據動畫與帳單合併邏輯
│   └── api/                # 後端 API 接口 (Auth, Payees, Requests)
├── components/             # 可複用 UI 組件
├── lib/                    # 核心邏輯工具 (DB 接接、工具函數)
└── public/                 # 靜態資源、Manifest 檔案
```

---

## 📜 授權協議 (License)
本專案採私有化開發，由 **ADAM LIU** 擁有最終版權。

---
