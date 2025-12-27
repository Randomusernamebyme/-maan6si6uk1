# Firebase 設置指南

## 1. Firestore Security Rules 部署

### 步驟：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的專案「maan6si6uk1」
3. 在左側選單點擊「Firestore Database」
4. 切換到「規則」標籤
5. 複製 `firestore.rules` 文件的內容
6. 貼上到 Firebase Console 的規則編輯器中
7. 點擊「發布」按鈕

### 注意事項：

- Security Rules 會立即生效
- 建議先在測試環境中測試規則
- 確保所有必要的索引已創建（見下方）

## 2. Firestore 索引設置

以下查詢需要創建複合索引。當您首次運行應用程式時，Firebase 會提示您創建這些索引，或者您可以手動創建：

### 需要創建的索引：

1. **requests 集合**
   - 欄位：`status` (Ascending), `createdAt` (Descending)
   - 用於：查詢特定狀態的委托

2. **applications 集合**
   - 欄位：`requestId` (Ascending), `createdAt` (Descending)
   - 用於：查詢特定委托的報名記錄

3. **applications 集合**
   - 欄位：`volunteerId` (Ascending), `createdAt` (Descending)
   - 用於：查詢義工的報名記錄

4. **notifications 集合**
   - 欄位：`userId` (Ascending), `createdAt` (Descending)
   - 用於：查詢用戶的通知

5. **users 集合**
   - 欄位：`role` (Ascending), `createdAt` (Descending)
   - 用於：查詢特定角色的用戶

### 手動創建索引：

1. 前往 Firebase Console > Firestore Database > 索引
2. 點擊「新增索引」
3. 選擇集合名稱
4. 添加查詢欄位
5. 點擊「建立」

## 3. 環境變數設置

請確保 `.env.local` 文件已正確配置（已在專案中創建）。

## 4. 測試設置

完成上述設置後，請測試以下功能：

1. ✅ 義工註冊和登入
2. ✅ 管理員登入
3. ✅ 創建委托（管理員）
4. ✅ 義工查看和報名委托
5. ✅ 管理員審核報名

## 5. 常見問題

### 問題：Permission Denied 錯誤

**解決方案**：
- 檢查 Security Rules 是否已正確部署
- 確認用戶已登入
- 檢查用戶的 role 欄位是否正確設置

### 問題：索引錯誤

**解決方案**：
- 前往 Firebase Console 創建缺少的索引
- 等待索引建立完成（可能需要幾分鐘）

### 問題：無法讀取委托者資訊

**解決方案**：
- 這是正常行為，只有管理員可以查看委托者詳細資訊
- 義工只能看到委托的描述和服務範疇

