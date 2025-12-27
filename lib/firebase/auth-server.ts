import { cookies } from "next/headers"
import { adminAuth, adminDb } from "./admin"
import { User } from "@/types"

// 獲取服務器端會話
export async function getServerSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return null
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
    const userDoc = await adminDb.collection("users").doc(decodedClaims.uid).get()

    if (!userDoc.exists) {
      return null
    }

    return { uid: decodedClaims.uid, ...userDoc.data() } as User
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

