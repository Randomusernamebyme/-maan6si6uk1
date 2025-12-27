import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { join } from 'path';
import { readFileSync } from 'fs';

// 初始化 Firebase Admin SDK（避免重複初始化）
let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (getApps().length === 0) {
  try {
    // 優先使用 JSON 文件（如果存在）
    const serviceAccountPath = join(process.cwd(), 'maan6si6uk1-firebase-adminsdk-fbsvc-76e70ff62f.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (fileError) {
    // 如果文件不存在，使用環境變數
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      .replace(/^"|"$/g, ''); // 移除首尾引號

    if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      console.error("Firebase Admin SDK 配置不完整");
      // 在開發環境中，如果配置不完整，不拋出錯誤（允許客戶端操作）
      throw new Error("Firebase Admin SDK 配置不完整，請檢查環境變數或 JSON 文件");
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    });

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

export { adminAuth, adminDb };
export default adminApp;

