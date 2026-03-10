"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 從 Firestore 獲取用戶資料
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // 轉換 Firestore Timestamp 為 Date
        return {
          ...userData,
          createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date(userData.createdAt),
          updatedAt: userData.updatedAt instanceof Date ? userData.updatedAt : new Date(userData.updatedAt),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 登入（不再強制檢查電郵是否已驗證）
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || "登入失敗");
    }
  };

  // 註冊
  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      // 檢查電話號碼是否已被使用（全站唯一）
      if (userData.phone) {
        const phoneQuery = query(
          collection(db, "users"),
          where("phone", "==", userData.phone)
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
          throw new Error(
            "此電話號碼已被其他帳號使用。如你已註冊過，請改用該帳號的電郵去登入，或到「忘記密碼」頁面重設密碼。"
          );
        }
      }

      // 檢查電郵是否已被使用（全站唯一）
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        throw new Error(
          "此電子郵件已經註冊過帳號。如你忘記密碼，請使用「忘記密碼」功能重設密碼，或改用其他電郵註冊。"
        );
      }

      // 建立 Firebase Auth 帳號（不強制驗證電郵）
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        uid: userCredential.user.uid,
        email,
        role: "volunteer",
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
      };

      // 保存用戶資料到 Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setUser(newUser);
    } catch (error: any) {
      // 處理常見錯誤訊息
      if (error?.code === "auth/email-already-in-use") {
        throw new Error(
          "此電子郵件已經註冊過帳號。如你忘記密碼，請使用「忘記密碼」功能重設密碼，或改用其他電郵註冊。"
        );
      }
      throw new Error(error.message || "註冊失敗");
    }
  };

  // 登出
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || "登出失敗");
    }
  };

  // 發送密碼重置郵件
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "發送密碼重置郵件失敗");
    }
  };

  // 修改密碼
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("請先登入");
      }

      // 重新認證
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // 更新密碼
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      throw new Error(error.message || "修改密碼失敗");
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout, sendPasswordReset, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

