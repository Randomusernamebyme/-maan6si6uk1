import { auth } from "@/lib/firebase/config";
import { User as FirebaseUser } from "firebase/auth";

// 獲取 Firebase Auth Token
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

