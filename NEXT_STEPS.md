# 下一步操作指南

## 🎯 立即需要完成的事項

### 1. 部署 Firestore Security Rules（必須完成）

**這是最重要的一步！**

1. 打開 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案「maan6si6uk1」
3. 點擊左側「Firestore Database」
4. 切換到「規則」標籤
5. 打開專案中的 `firestore.rules` 文件
6. 複製全部內容
7. 貼上到 Firebase Console 的規則編輯器
8. 點擊「發布」按鈕

**⚠️ 警告**：如果沒有部署 Security Rules，應用程式將無法正常運作！

### 2. 確認環境變數

檢查 `.env.local` 文件是否存在且包含所有必要的環境變數。如果不存在，請創建它並填入 Firebase 配置資訊。

### 3. 啟動應用程式

```bash
npm run dev
```

應用程式將在 http://localhost:3000 運行

### 4. 創建第一個管理員帳號

由於系統需要管理員帳號，請按照以下步驟創建：

#### 方法一：通過 Firebase Console

1. 前往 Firebase Console > Authentication
2. 點擊「新增使用者」
3. 輸入管理員的電子郵件和密碼
4. 記錄下用戶的 UID

#### 方法二：通過應用程式註冊後手動修改

1. 使用應用程式註冊一個普通義工帳號
2. 在 Firebase Console > Firestore Database > users 集合
3. 找到該用戶的文檔
4. 將 `role` 欄位改為 `"admin"`
5. 將 `status` 欄位改為 `"approved"`

### 5. 測試基本功能

1. **測試義工註冊**
   - 訪問 http://localhost:3000/register
   - 填寫註冊表單
   - 確認可以成功註冊

2. **測試登入**
   - 訪問 http://localhost:3000/login
   - 使用註冊的帳號登入
   - 確認可以成功登入並看到義工儀表板

3. **測試管理員功能**
   - 使用管理員帳號登入
   - 確認可以看到管理後台

## 📋 功能檢查清單

### 已完成的功能
- ✅ 用戶註冊和登入
- ✅ 義工儀表板
- ✅ 委托列表查看
- ✅ 報名功能
- ✅ 管理員儀表板
- ✅ 委托管理
- ✅ 個人資料編輯

### 需要進一步開發的功能
- ⏳ 管理員創建委托表單
- ⏳ 義工審核頁面
- ⏳ 報名審核功能（接受/拒絕）
- ⏳ 通知系統完善
- ⏳ 搜索和篩選功能

## 🐛 常見問題排查

### 問題：無法登入
**解決方案**：
- 檢查 Firebase Authentication 是否已啟用 Email/Password
- 檢查 `.env.local` 中的 Firebase 配置是否正確
- 檢查瀏覽器控制台是否有錯誤訊息

### 問題：Permission Denied
**解決方案**：
- 確認 Firestore Security Rules 已正確部署
- 確認用戶已登入
- 檢查用戶的 `role` 欄位是否正確

### 問題：無法讀取數據
**解決方案**：
- 檢查 Firestore 索引是否已創建
- 查看 Firebase Console 的錯誤訊息
- 確認 Security Rules 允許該操作

## 📚 相關文檔

- `SETUP_COMPLETE.md` - 完整的設置說明
- `FIREBASE_SETUP.md` - Firebase 詳細設置指南
- `DEPLOYMENT.md` - 部署到生產環境的指南

## 🚀 準備部署

當本地測試完成後，可以參考 `DEPLOYMENT.md` 將應用程式部署到 Vercel。

祝您使用愉快！

