# 萬事屋平台

社區服務平台，連接需要幫助的委托者與願意提供服務的義工。

## 技術棧

- **前端**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes + Firebase (Auth, Firestore, Storage)
- **UI 組件**: shadcn/ui

## 開發環境設置

1. 安裝依賴：
```bash
npm install
```

2. 設置環境變數：
複製 `.env.local.example` 為 `.env.local` 並填入 Firebase 配置資訊。

3. 啟動開發伺服器：
```bash
npm run dev
```

## Firebase 設置

請確保已在 Firebase Console 中：
- 啟用 Authentication (Email/Password)
- 啟用 Firestore Database
- 啟用 Storage
- 設置 Firestore Security Rules

## 專案結構

```
├── app/                    # Next.js App Router
├── components/             # React 組件
├── lib/                   # 工具函數和配置
├── types/                 # TypeScript 類型定義
└── public/                # 靜態資源
```

