import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Query,
} from "firebase/firestore"
import { db } from "./config"
import { Request, Application, Notification, User } from "@/types"

// ========== Requests ==========

export async function createRequest(requestData: Omit<Request, "id" | "createdAt" | "updatedAt">) {
  const requestsRef = collection(db, "requests")
  const newRequestRef = doc(requestsRef)
  
  await setDoc(newRequestRef, {
    ...requestData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  
  return newRequestRef.id
}

export async function getRequest(requestId: string): Promise<Request | null> {
  const requestDoc = await getDoc(doc(db, "requests", requestId))
  if (!requestDoc.exists()) {
    return null
  }
  return { id: requestDoc.id, ...requestDoc.data() } as Request
}

export async function getRequests(status?: string): Promise<Request[]> {
  let q: Query = query(collection(db, "requests"), orderBy("createdAt", "desc"))
  
  if (status) {
    q = query(q, where("status", "==", status))
  }
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Request[]
}

export function subscribeToRequests(
  callback: (requests: Request[]) => void,
  status?: string
) {
  let q: Query = query(collection(db, "requests"), orderBy("createdAt", "desc"))
  
  if (status) {
    q = query(q, where("status", "==", status))
  }
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Request[]
    callback(requests)
  })
}

export async function updateRequest(
  requestId: string,
  updates: Partial<Request>
) {
  await updateDoc(doc(db, "requests", requestId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ========== Applications ==========

export async function createApplication(
  applicationData: Omit<Application, "id" | "createdAt" | "updatedAt">
) {
  const applicationsRef = collection(db, "applications")
  const newApplicationRef = doc(applicationsRef)
  
  await setDoc(newApplicationRef, {
    ...applicationData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  
  return newApplicationRef.id
}

export async function getApplication(applicationId: string): Promise<Application | null> {
  const applicationDoc = await getDoc(doc(db, "applications", applicationId))
  if (!applicationDoc.exists()) {
    return null
  }
  return { id: applicationDoc.id, ...applicationDoc.data() } as Application
}

export async function getApplicationsByRequest(requestId: string): Promise<Application[]> {
  const q = query(
    collection(db, "applications"),
    where("requestId", "==", requestId),
    orderBy("createdAt", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[]
}

export async function getApplicationsByVolunteer(volunteerId: string): Promise<Application[]> {
  const q = query(
    collection(db, "applications"),
    where("volunteerId", "==", volunteerId),
    orderBy("createdAt", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[]
}

export async function updateApplication(
  applicationId: string,
  updates: Partial<Application>
) {
  await updateDoc(doc(db, "applications", applicationId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ========== Users ==========

export async function getUser(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", userId))
  if (!userDoc.exists()) {
    return null
  }
  return { uid: userDoc.id, ...userDoc.data() } as User
}

export async function getUsers(role?: UserRole): Promise<User[]> {
  let q: Query = query(collection(db, "users"), orderBy("createdAt", "desc"))
  
  if (role) {
    q = query(q, where("role", "==", role))
  }
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as User[]
}

export async function updateUser(userId: string, updates: Partial<User>) {
  await updateDoc(doc(db, "users", userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

// ========== Notifications ==========

export async function createNotification(
  notificationData: Omit<Notification, "id" | "createdAt">
) {
  const notificationsRef = collection(db, "notifications")
  const newNotificationRef = doc(notificationsRef)
  
  await setDoc(newNotificationRef, {
    ...notificationData,
    createdAt: serverTimestamp(),
  })
  
  return newNotificationRef.id
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[]
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  )
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[]
    callback(notifications)
  })
}

export async function markNotificationAsRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  })
}

