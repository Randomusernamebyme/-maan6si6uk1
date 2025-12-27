import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin SDK（避免重複初始化）
let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (getApps().length === 0) {
  // 從環境變數構建服務帳戶憑證
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

export { adminAuth, adminDb };
export default adminApp;

