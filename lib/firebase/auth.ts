import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from "firebase/auth"
import { auth } from "./config"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import { User, UserRole } from "@/types"

// 客戶端登入
export async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// 客戶端註冊
export async function register(
  email: string,
  password: string,
  userData: Partial<User>
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  
  // 創建用戶文檔
  const userDoc: Omit<User, "uid"> = {
    email,
    role: (userData.role || "volunteer") as UserRole,
    displayName: userData.displayName || "",
    phone: userData.phone || "",
    age: userData.age || "",
    fields: userData.fields || [],
    skills: userData.skills || [],
    availability: userData.availability || [],
    targetAudience: userData.targetAudience || [],
    goals: userData.goals,
    status: "pending",
    completedTasks: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await setDoc(doc(db, "users", userCredential.user.uid), {
    ...userDoc,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return userCredential.user
}

// 客戶端登出
export async function logout() {
  await signOut(auth)
}

// 獲取當前用戶資料
export async function getCurrentUserData(
  firebaseUser: FirebaseUser
): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
  if (!userDoc.exists()) {
    return null
  }
  return { uid: firebaseUser.uid, ...userDoc.data() } as User
}

// 監聽認證狀態變化
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback)
}

