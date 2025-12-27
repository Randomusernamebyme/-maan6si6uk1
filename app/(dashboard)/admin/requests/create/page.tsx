"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { createRequest } from "@/lib/firebase/firestore"
import { Request } from "@/types"
import { RequestForm } from "@/components/requests/RequestForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateRequestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && user.role !== "admin") {
      router.push("/volunteer")
    }
  }, [user, loading, router])

  const handleSubmit = async (
    data: Omit<Request, "id" | "createdAt" | "updatedAt" | "status">
  ) => {
    setSubmitting(true)
    try {
      await createRequest(data)
      router.push("/admin/requests")
      router.refresh()
    } catch (error) {
      console.error("創建委托失敗:", error)
      alert("創建失敗，請稍後再試")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">創建新委托</h1>
          <Link href="/admin/requests">
            <Button variant="outline">返回委托管理</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <RequestForm onSubmit={handleSubmit} loading={submitting} />
      </main>
    </div>
  )
}

