# 部署指南

## 前置準備

1. 確保所有 Firebase 設置已完成（參考 `FIREBASE_SETUP.md`）
2. 確保 `.env.local` 文件已正確配置
3. 確保所有依賴已安裝：`npm install`

## 本地開發

```bash
# 啟動開發伺服器
npm run dev

# 應用程式將在 http://localhost:3000 運行
```

## 部署到 Vercel

### 步驟：

1. 將代碼推送到 GitHub：
   ```bash
   git add .
   git commit -m "初始提交"
   git push origin main
   ```

2. 前往 [Vercel](https://vercel.com/)
3. 點擊「New Project」
4. 導入您的 GitHub 倉庫
5. 配置環境變數：
   - 在 Vercel 專案設置中添加所有 `.env.local` 中的環境變數
   - 確保 `NEXT_PUBLIC_APP_URL` 設置為您的 Vercel 域名

6. 點擊「Deploy」

### 環境變數設置（Vercel）：

在 Vercel 專案設置 > Environment Variables 中添加：

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`（注意：需要完整包含換行符）
- `NEXT_PUBLIC_APP_URL`（設置為您的 Vercel 域名）

## 部署後檢查清單

- [ ] 確認應用程式可以正常訪問
- [ ] 測試登入功能
- [ ] 測試註冊功能
- [ ] 測試管理員功能
- [ ] 確認 Firestore Security Rules 已部署
- [ ] 確認所有索引已創建
- [ ] 檢查錯誤日誌

## 後續維護

1. **更新代碼**：推送到 GitHub，Vercel 會自動部署
2. **更新 Firestore Rules**：在 Firebase Console 手動更新
3. **監控**：使用 Vercel 和 Firebase Console 監控應用程式狀態

