# Vercel 環境變數設置指南

## Firebase Admin SDK Private Key 設置

如果遇到 "Failed to parse private key" 錯誤，請按照以下步驟設置 Vercel 環境變數：

### 步驟 1：獲取 Private Key

1. 從 Firebase Console 下載服務帳號 JSON 文件
2. 打開 JSON 文件，找到 `private_key` 欄位

### 步驟 2：格式化 Private Key

Private key 應該是一個完整的字符串，包含：
- `-----BEGIN PRIVATE KEY-----`
- 私鑰內容（多行）
- `-----END PRIVATE KEY-----`

### 步驟 3：在 Vercel 中設置環境變數

1. 登入 Vercel Dashboard
2. 選擇您的專案
3. 前往 **Settings** → **Environment Variables**
4. 添加以下環境變數：

#### 方法 A：直接複製（推薦）

將整個 private key（包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`）複製到 Vercel 環境變數中。

**重要**：如果 private key 包含換行符，請確保：
- 在 Vercel 環境變數中，每行之間使用 `\n` 表示換行
- 或者將整個 private key 作為單行字符串（系統會自動處理換行符）

#### 方法 B：使用 JSON 格式

如果從 JSON 文件中複製，private key 可能是這樣的格式：
```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

在這種情況下：
1. 複製整個 `private_key` 的值（包括引號內的內容）
2. 在 Vercel 中，**不要**包含外層引號
3. 確保 `\n` 被保留（Vercel 會自動處理）

### 步驟 4：設置其他必要的環境變數

確保以下環境變數都已設置：

- `FIREBASE_ADMIN_PRIVATE_KEY` - Private key（如上所述）
- `FIREBASE_ADMIN_PROJECT_ID` - Firebase 專案 ID
- `FIREBASE_ADMIN_CLIENT_EMAIL` - 服務帳號的 email（例如：`firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com`）

### 步驟 5：重新部署

設置環境變數後，需要重新部署專案：

1. 在 Vercel Dashboard 中，點擊 **Deployments**
2. 找到最新的部署
3. 點擊 **Redeploy**

或者推送一個新的 commit 來觸發自動部署。

### 常見問題

#### Q: 仍然出現 "Failed to parse private key" 錯誤？

**A:** 請檢查：
1. Private key 是否包含完整的 `BEGIN` 和 `END` 標記
2. Private key 中是否有額外的空格或特殊字符
3. 環境變數是否正確設置（檢查是否有拼寫錯誤）
4. 是否在正確的環境中設置（Production/Preview/Development）

#### Q: 如何驗證環境變數是否正確設置？

**A:** 在 Vercel Dashboard 中：
1. 前往 **Settings** → **Environment Variables**
2. 確認所有變數都已設置
3. 檢查變數值是否正確（注意：private key 的值會被隱藏，但可以確認它存在）

#### Q: 本地開發環境正常，但 Vercel 部署失敗？

**A:** 這通常是因為：
1. Vercel 環境變數格式與本地 `.env.local` 不同
2. Private key 在 Vercel 中的格式需要特殊處理
3. 確保在 Vercel 中設置了所有必要的環境變數

### 示例：正確的 Private Key 格式

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
（多行私鑰內容）
...
-----END PRIVATE KEY-----
```

在 Vercel 環境變數中，應該設置為：
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----
```

或者直接複製多行格式（Vercel 會自動處理）。

### 需要幫助？

如果問題仍然存在，請檢查：
1. Vercel 部署日誌中的詳細錯誤訊息
2. Firebase Console 中的服務帳號設置
3. 確保服務帳號有正確的權限

