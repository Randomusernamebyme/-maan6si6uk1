"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export function useRequireAuth(requiredRole?: "admin" | "volunteer") {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // 未登入，重定向到登入頁
        router.push("/login");
      } else if (requiredRole && user.role !== requiredRole) {
        // 角色不符，重定向到首頁
        router.push("/");
      }
    }
  }, [user, loading, requiredRole, router]);

  return { user, loading };
}


