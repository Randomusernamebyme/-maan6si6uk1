# Vercel 部署指南

## ✅ 代碼已推送到 GitHub

您的代碼已成功推送到：`https://github.com/Randomusernamebyme/-maan6si6uk1.git`

## 🚀 在 Vercel 上部署

### 步驟 1: 連接 GitHub 倉庫

1. 前往 [Vercel](https://vercel.com/)
2. 使用 GitHub 帳號登入
3. 點擊「Add New Project」或「New Project」
4. 選擇您的倉庫 `Randomusernamebyme/-maan6si6uk1`
5. 點擊「Import」

### 步驟 2: 配置專案設置

Vercel 會自動檢測 Next.js 專案，保持默認設置即可：
- **Framework Preset**: Next.js（自動檢測）
- **Root Directory**: `./`（默認）
- **Build Command**: `npm run build`（自動）
- **Output Directory**: `.next`（自動）

### 步驟 3: 設置環境變數 ⚠️ **重要**

在「Environment Variables」區塊，添加以下環境變數：

#### Firebase Web App 配置
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCRZrcO60pVOmgG2PPE5j-OLAKnsyNQk6A
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=maan6si6uk1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=maan6si6uk1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=maan6si6uk1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=349293937280
NEXT_PUBLIC_FIREBASE_APP_ID=1:349293937280:web:ca2f091d1107bae7e09c65
```

#### Firebase Admin SDK 配置
```
FIREBASE_ADMIN_PROJECT_ID=maan6si6uk1
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@maan6si6uk1.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDAgjfIOthIqmYw\nNCvS5abN4hZvHF0x9ey6zkvbOSdo6vbLfF/tPaLRWY9EJdNMXaJ0k0mDOeTz7qGb\nryhLnfh1O7VL4fJFsxdsLSNu3X0uViZL0Zu9EpyfeaCxvuSkenNhokh3gEPLGRFZ\nue/clO7nvWkHYFTp8DNnANUWdaTOk/yv2fh77nph/n7DbfIHHoKkqqr0ob2Nt2Bm\nEG+tpdHrBNIoCuP41xa8BwAWpJyHpqtZvwsZdAsxMp2kkP4oHcflebJuOF/ZaPc0\nTWQ6vOKaX/9Y/kbAo/cBjiyeU9Yo9r1eSidSfRDTwoKlzr1cWU11lvqh74o4hKHg\nCmelesifAgMBAAECggEAAW72y17kzWW3bRR2XxOmslHEqP8lEoIqSRnQJsm+KWHW\nhJ1geXvEApsQHgnKEP+Bfiy6l2eO9OIKAgbD3gxHFVhkeTQtgadbvUp4wRKVJAsw\nLdBZwIaq8+UL9UbenPrscQWsVHd4CcMeBfUEfDf/r2oRpiRpfXR0bYfsDkbB+2fL\nYO3Hq90v8iIn0g5vAm6IXayOCB+origAu5/+bjOk98z8XrzEyMZyMXOiWRSEObyQ\nDknwBxgE4Ad38lIP6VsJUfaA0bivmhi+8OEHV1T7B4Aw7jNUnzdoDbfSfCde9KBZ\nWnM+bcwPmpKZlGdMtmd9ZAbET+DNjFVRNpyv6yWswQKBgQDwGPCjrFNDXclNCMAv\n4BqaxWryX+QxhrKj7E0mRqCgmT7mMRGSoDH0ZuI2G6qiDEOcepM4NmXaCrXfQn08\n07UcacUpx8VNkxrPi42n/wZqyZntQX2KKCQF6IQ0frgL97VSKMZH7vpQ396HChGX\n9iV1PWQFO3PAGYsjQfa/qaoA7QKBgQDNQl6GTyfnopSxnjew6VqRuxgBqu98Yvzs\n7uPIQClM46Io9mBja+8eMINR/8TVoL5yGOEqehzllYUmXNOiKOUq9YC2skAEOYhd\nXTlTIEPq+Q0wUAWNGHwgxStvvhxBzOYml9MmL9gMNeHN95r8ovLnKW2I/xQ4vPJj\nYDoyj/aaOwKBgGyAyNcevG4YRy2CA+Be5YcGKoOoJCbhmX+M/XyLtHF/b7Z1fFyH\n+qtZh2cub5lV84QWvMtNgg/cgT6I/LHtds6FWi28cwTQsvASQA0oqgy+WMqoqwQx\nib4FyyEyFxiJdC7R8HF3pTXBRf4+5Z6IBXuLJ9VZfcDVilR/rfQFx6ctAoGAPvMC\n0EgIYfaviYWPaNc4KodphmFpDwnArd1ZyDk9MVKCkfN1fihE7kpMi+JX+HhSz+Un\ncQKASDzB2BER6qKGHdWrAtzJ20HVu2RyxzaW/cIhtFZmTW5b6yTs/Fkei2OOlfls\nDUMRDDWeKa+tPZuvyQsgh6pLBleUMrv5PTZ/l68CgYA3Mgwq4WZNNMvGC2cjkm2N\ny/o75BcFplHGSLYkQW+UapGlX1q+fx7PDAKLya/GkrolbNR5xUp1iWQNIssjm6mW\n6pVPYpR7Lc8ChC8ECdN2X7SvW16sjlPFae4GYaWMg6x0wH7kxNnmItDi9XZlymXG\nTzW3b/xwFX4W8yxMquEPsw==\n-----END PRIVATE KEY-----\n
```

#### 應用程式 URL（部署後更新）
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**注意**：
- `FIREBASE_ADMIN_PRIVATE_KEY` 必須包含完整的換行符（`\n`）
- 部署後，將 `NEXT_PUBLIC_APP_URL` 更新為 Vercel 提供的實際域名
- 所有環境變數都應該設置為「Production」、「Preview」和「Development」環境

### 步驟 4: 部署

1. 點擊「Deploy」按鈕
2. 等待構建完成（通常需要 2-3 分鐘）
3. 部署成功後，Vercel 會提供一個 URL（例如：`https://maan6si6uk1.vercel.app`）

### 步驟 5: 部署後設置

#### 1. 更新 NEXT_PUBLIC_APP_URL

部署完成後，在 Vercel 專案設置中更新：
```
NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
```

#### 2. 部署 Firestore Security Rules

**必須完成**：
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案「maan6si6uk1」
3. Firestore Database > 規則
4. 複製 `firestore.rules` 文件的內容
5. 貼上並點擊「發布」

#### 3. 創建 Firestore 索引

當首次使用應用程式時，Firebase 會提示創建索引，或參考 `FIREBASE_SETUP.md` 手動創建。

#### 4. 創建管理員帳號

參考 `FINAL_SETUP_CONFIRMATION.md` 中的說明創建第一個管理員帳號。

## 🔄 自動部署

設置完成後，每次推送到 GitHub 的 `main` 分支，Vercel 會自動重新部署。

## 📋 部署檢查清單

部署前確認：
- [ ] 所有環境變數已設置在 Vercel
- [ ] Firestore Security Rules 已部署
- [ ] Firestore 索引已創建（或等待自動提示）
- [ ] 管理員帳號已創建

部署後測試：
- [ ] 訪問應用程式 URL
- [ ] 測試登入功能
- [ ] 測試註冊功能
- [ ] 測試管理員功能
- [ ] 檢查錯誤日誌（如有問題）

## 🐛 常見問題

### 問題：構建失敗

**解決方案**：
- 檢查環境變數是否正確設置
- 確認所有依賴都在 `package.json` 中
- 查看 Vercel 構建日誌

### 問題：環境變數未生效

**解決方案**：
- 確認環境變數名稱正確（區分大小寫）
- 確認已設置為正確的環境（Production/Preview/Development）
- 重新部署應用程式

### 問題：Firebase 連接失敗

**解決方案**：
- 檢查環境變數是否正確
- 確認 Firebase 專案設置正確
- 檢查 Firestore Security Rules 是否已部署

## 📚 相關文檔

- `DEPLOYMENT.md` - 詳細部署指南
- `FIREBASE_SETUP.md` - Firebase 設置說明
- `FINAL_SETUP_CONFIRMATION.md` - 最終設置確認

---

**祝部署順利！** 🎉

