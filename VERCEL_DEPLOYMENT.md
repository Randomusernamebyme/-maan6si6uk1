# Vercel 部署指南

## 部署前準備

### ✅ 已完成
- [x] Next.js 專案已初始化
- [x] 專案可以成功構建（`npm run build` 測試通過）
- [x] Git 倉庫已設置並推送到 GitHub
- [x] Firebase 配置已準備

### 📋 需要準備
- [ ] Vercel 帳號（如果還沒有，請前往 [vercel.com](https://vercel.com) 註冊）
- [ ] GitHub 帳號已連接 Vercel

## 部署步驟

### 方法 1: 通過 Vercel Dashboard（推薦）

1. **登入 Vercel**
   - 前往 [vercel.com](https://vercel.com)
   - 使用 GitHub 帳號登入

2. **導入專案**
   - 點擊「Add New...」→「Project」
   - 選擇 GitHub 倉庫：`Randomusernamebyme/-maan6si6uk1`
   - 點擊「Import」

3. **配置專案設置**
   - **Framework Preset**: Next.js（應該自動偵測）
   - **Root Directory**: `./`（保持預設）
   - **Build Command**: `npm run build`（預設）
   - **Output Directory**: `.next`（預設）
   - **Install Command**: `npm install`（預設）

4. **設置環境變數**
   在「Environment Variables」區塊，添加以下變數：

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCRZrcO60pVOmgG2PPE5j-OLAKnsyNQk6A
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=maan6si6uk1.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=maan6si6uk1
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=maan6si6uk1.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=349293937280
   NEXT_PUBLIC_FIREBASE_APP_ID=1:349293937280:web:ca2f091d1107bae7e09c65
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4LWCWNPHB2
   FIREBASE_ADMIN_PROJECT_ID=maan6si6uk1
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@maan6si6uk1.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDAgjfIOthIqmYw\nNCvS5abN4hZvHF0x9ey6zkvbOSdo6vbLfF/tPaLRWY9EJdNMXaJ0k0mDOeTz7qGb\nryhLnfh1O7VL4fJFsxdsLSNu3X0uViZL0Zu9EpyfeaCxvuSkenNhokh3gEPLGRFZ\nue/clO7nvWkHYFTp8DNnANUWdaTOk/yv2fh77nph/n7DbfIHHoKkqqr0ob2Nt2Bm\nEG+tpdHrBNIoCuP41xa8BwAWpJyHpqtZvwsZdAsxMp2kkP4oHcflebJuOF/ZaPc0\nTWQ6vOKaX/9Y/kbAo/cBjiyeU9Yo9r1eSidSfRDTwoKlzr1cWU11lvqh74o4hKHg\nCmelesifAgMBAAECggEAAW72y17kzWW3bRR2XxOmslHEqP8lEoIqSRnQJsm+KWHW\nhJ1geXvEApsQHgnKEP+Bfiy6l2eO9OIKAgbD3gxHFVhkeTQtgadbvUp4wRKVJAsw\nLdBZwIaq8+UL9UbenPrscQWsVHd4CcMeBfUEfDf/r2oRpiRpfXR0bYfsDkbB+2fL\nYO3Hq90v8iIn0g5vAm6IXayOCB+origAu5/+bjOk98z8XrzEyMZyMXOiWRSEObyQ\nDknwBxgE4Ad38lIP6VsJUfaA0bivmhi+8OEHV1T7B4Aw7jNUnzdoDbfSfCde9KBZ\nWnM+bcwPmpKZlGdMtmd9ZAbET+DNjFVRNpyv6yWswQKBgQDwGPCjrFNDXclNCMAv\n4BqaxWryX+QxhrKj7E0mRqCgmT7mMRGSoDH0ZuI2G6qiDEOcepM4NmXaCrXfQn08\n07UcacUpx8VNkxrPi42n/wZqyZntQX2KKCQF6IQ0frgL97VSKMZH7vpQ396HChGX\n9iV1PWQFO3PAGYsjQfa/qaoA7QKBgQDNQl6GTyfnopSxnjew6VqRuxgBqu98Yvzs\n7uPIQClM46Io9mBja+8eMINR/8TVoL5yGOEqehzllYUmXNOiKOUq9YC2skAEOYhd\nXTlTIEPq+Q0wUAWNGHwgxStvvhxBzOYml9MmL9gMNeHN95r8ovLnKW2I/xQ4vPJj\nYDoyj/aaOwKBgGyAyNcevG4YRy2CA+Be5YcGKoOoJCbhmX+M/XyLtHF/b7Z1fFyH\n+qtZh2cub5lV84QWvMtNgg/cgT6I/LHtds6FWi28cwTQsvASQA0oqgy+WMqoqwQx\nib4FyyEyFxiJdC7R8HF3pTXBRf4+5Z6IBXuLJ9VZfcDVilR/rfQFx6ctAoGAPvMC\n0EgIYfaviYWPaNc4KodphmFpDwnArd1ZyDk9MVKCkfN1fihE7kpMi+JX+HhSz+Un\ncQKASDzB2BER6qKGHdWrAtzJ20HVu2RyxzaW/cIhtFZmTW5b6yTs/Fkei2OOlfls\nDUMRDDWeKa+tPZuvyQsgh6pLBleUMrv5PTZ/l68CgYA3Mgwq4WZNNMvGC2cjkm2N\nny/o75BcFplHGSLYkQW+UapGlX1q+fx7PDAKLya/GkrolbNR5xUp1iWQNIssjm6mW\n6pVPYpR7Lc8ChC8ECdN2X7SvW16sjlPFae4GYaWMg6x0wH7kxNnmItDi9XZlymXG\nTzW3b/xwFX4W8yxMquEPsw==\n-----END PRIVATE KEY-----\n"
   NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
   ```

   **重要提示**：
   - 將 `NEXT_PUBLIC_APP_URL` 中的 `your-project-name` 替換為 Vercel 分配給您的實際域名
   - 或者先部署，然後再回來更新這個變數為實際的部署 URL

5. **部署**
   - 點擊「Deploy」按鈕
   - 等待構建完成（通常需要 1-3 分鐘）

6. **獲取部署 URL**
   - 部署完成後，Vercel 會提供一個 URL，例如：`https://maan6si6uk1.vercel.app`
   - 記下這個 URL，並更新 `NEXT_PUBLIC_APP_URL` 環境變數

### 方法 2: 使用 Vercel CLI

1. **安裝 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```
   按照提示完成部署：
   - 選擇專案範圍
   - 確認專案設置
   - 設置環境變數（或稍後在 Dashboard 設置）

4. **設置環境變數**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   # ... 依此類推添加所有環境變數
   ```

5. **生產環境部署**
   ```bash
   vercel --prod
   ```

## 環境變數設置清單

在 Vercel Dashboard → Project Settings → Environment Variables 中設置：

### 必需變數（所有環境）
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`（部署後更新為實際 URL）

## 部署後檢查

1. **訪問部署 URL**
   - 確認網站可以正常訪問
   - 檢查首頁是否正常顯示

2. **檢查 Firebase 連接**
   - 確認 Firebase 服務可以正常連接
   - 檢查瀏覽器控制台是否有錯誤

3. **更新 Firebase 授權域名**
   - 前往 Firebase Console → Authentication → Settings → Authorized domains
   - 添加 Vercel 域名（例如：`maan6si6uk1.vercel.app`）

4. **測試功能**
   - 測試登入功能
   - 測試資料庫連接

## 常見問題

### 問題 1: 構建失敗
**解決方案**：
- 檢查環境變數是否正確設置
- 確認 `package.json` 中的依賴版本正確
- 查看 Vercel 構建日誌中的錯誤訊息

### 問題 2: Firebase 連接失敗
**解決方案**：
- 確認所有 Firebase 環境變數已正確設置
- 檢查 Firebase Console 中的授權域名設置
- 確認 Firestore Security Rules 允許來自 Vercel 域名的請求

### 問題 3: 環境變數未生效
**解決方案**：
- 確認變數名稱正確（注意大小寫）
- 重新部署專案（環境變數更改後需要重新部署）
- 檢查變數是否設置為正確的環境（Production/Preview/Development）

## 自動部署

Vercel 會自動監聽 GitHub 倉庫的推送：
- 每次推送到 `main` 分支會觸發生產環境部署
- 推送到其他分支會創建預覽部署
- Pull Request 會自動創建預覽部署

## 下一步

部署完成後：
1. 測試所有功能是否正常
2. 設置自定義域名（可選）
3. 配置 Firebase 授權域名
4. 開始開發新功能

祝部署順利！

