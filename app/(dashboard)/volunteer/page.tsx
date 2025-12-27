"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { logout } from "@/lib/firebase/auth"
import { subscribeToRequests, createApplication } from "@/lib/firebase/firestore"
import { Request } from "@/types"
import { RequestCard } from "@/components/requests/RequestCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VolunteerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && user.role !== "volunteer") {
      router.push("/admin")
      return
    }

    if (user) {
      const unsubscribe = subscribeToRequests((data) => {
        // 只顯示待配對的委托
        const pendingRequests = data.filter((r) => r.status === "pending")
        setRequests(pendingRequests)
        setRequestsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user, loading, router])

  const handleApply = async (requestId: string) => {
    if (!user) return

    try {
      await createApplication({
        requestId,
        volunteerId: user.uid,
        volunteerName: user.displayName,
        status: "pending",
      })
      alert("報名成功！管理員會盡快處理您的申請。")
    } catch (error) {
      console.error("報名失敗:", error)
      alert("報名失敗，請稍後再試")
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (loading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">萬事屋平台 - 義工儀表板</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              歡迎, {user.displayName}
            </span>
            <Link href="/volunteer/applications">
              <Button variant="outline">我的報名</Button>
            </Link>
            <Link href="/volunteer/profile">
              <Button variant="outline">個人資料</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">可報名的委托</h2>
          <p className="text-muted-foreground">
            以下是等待義工報名的委托，點擊「報名此委托」即可申請
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">目前沒有可報名的委托</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApply={handleApply}
                showActions={user.status === "approved"}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

