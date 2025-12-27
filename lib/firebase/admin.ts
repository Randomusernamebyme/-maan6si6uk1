import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// 初始化 Firebase Admin SDK
function initializeAdminSDK(): { adminApp: App; adminAuth: Auth; adminDb: Firestore } {
  // 如果已經初始化，直接返回
  if (getApps().length > 0) {
    const app = getApps()[0];
    return {
      adminApp: app,
      adminAuth: getAuth(app),
      adminDb: getFirestore(app),
    };
  }

  // 檢查是否在 Vercel 環境中
  const isVercel = process.env.VERCEL === '1';
  
  // 本地開發環境：優先使用 JSON 文件
  if (!isVercel) {
    const serviceAccountPath = join(process.cwd(), 'maan6si6uk1-firebase-adminsdk-fbsvc-76e70ff62f.json');
    if (existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        const app = initializeApp({
          credential: cert(serviceAccount),
        });
        return {
          adminApp: app,
          adminAuth: getAuth(app),
          adminDb: getFirestore(app),
        };
      } catch (error) {
        console.warn("無法讀取 JSON 文件，嘗試使用環境變數:", error);
      }
    }
  }
  
  // 使用環境變數（Vercel 環境或 JSON 文件不存在）
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("Firebase Admin SDK 配置不完整：缺少 FIREBASE_ADMIN_PRIVATE_KEY");
  }

  // 處理 private key 格式
  // 1. 移除首尾引號（如果有的話）
  let cleanedPrivateKey = privateKey.replace(/^["']|["']$/g, '');
  // 2. 將 \n 轉換為實際的換行符
  cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');
  // 3. 確保以正確的格式開始和結束
  if (!cleanedPrivateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error("Firebase Admin SDK private key 格式不正確");
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error("Firebase Admin SDK 配置不完整：缺少 PROJECT_ID 或 CLIENT_EMAIL");
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: cleanedPrivateKey,
  };

  const app = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });

  return {
    adminApp: app,
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
  };
}

// 初始化並導出
const { adminApp, adminAuth, adminDb } = initializeAdminSDK();

export { adminAuth, adminDb };
export default adminApp;
