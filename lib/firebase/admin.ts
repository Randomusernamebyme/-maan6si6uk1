import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getAuth, Auth } from "firebase-admin/auth"
import { getFirestore, Firestore } from "firebase-admin/firestore"

let app: App
let adminAuth: Auth
let adminDb: Firestore

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
} else {
  app = getApps()[0]
  adminAuth = getAuth(app)
  adminDb = getFirestore(app)
}

export { adminAuth, adminDb }
export default app
