"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { UserRole } from "@/types"

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        // 如果角色不符合，重定向到對應的儀表板
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/volunteer")
        }
      }
    }
  }, [user, loading, requiredRole, router])

  return { user, loading }
}

