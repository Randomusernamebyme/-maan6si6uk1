"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { getUsers, updateUser } from "@/lib/firebase/firestore"
import { User } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

const statusColors: Record<User["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<User["status"], string> = {
  pending: "待審核",
  approved: "已審核",
  rejected: "已拒絕",
  suspended: "已暫停",
}

export default function VolunteersManagementPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [volunteers, setVolunteers] = useState<User[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user && user.role !== "admin") {
      router.push("/volunteer")
      return
    }

    if (user) {
      loadVolunteers()
    }
  }, [user, loading, router, filter])

  const loadVolunteers = async () => {
    try {
      const data = await getUsers("volunteer")
      setVolunteers(data)
    } catch (error) {
      console.error("載入義工列表失敗:", error)
    }
  }

  const handleStatusChange = async (volunteerId: string, newStatus: User["status"]) => {
    try {
      await updateUser(volunteerId, { status: newStatus })
      await loadVolunteers()
      alert("狀態已更新")
    } catch (error) {
      console.error("更新狀態失敗:", error)
      alert("更新失敗，請稍後再試")
    }
  }

  const filteredVolunteers = volunteers.filter((v) => {
    if (filter === "pending") return v.status === "pending"
    if (filter === "approved") return v.status === "approved"
    return true
  })

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">義工管理</h1>
          <Link href="/admin">
            <Button variant="outline">返回儀表板</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex gap-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            待審核 ({volunteers.filter((v) => v.status === "pending").length})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
          >
            已審核 ({volunteers.filter((v) => v.status === "approved").length})
          </Button>
        </div>

        <div className="space-y-4">
          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">沒有義工記錄</p>
            </div>
          ) : (
            filteredVolunteers.map((volunteer) => (
              <Card key={volunteer.uid}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{volunteer.displayName}</CardTitle>
                      <CardDescription>{volunteer.email}</CardDescription>
                    </div>
                    <Badge className={statusColors[volunteer.status]}>
                      {statusLabels[volunteer.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">電話:</span> {volunteer.phone}
                    </div>
                    <div>
                      <span className="font-semibold">年齡:</span> {volunteer.age}
                    </div>
                    <div>
                      <span className="font-semibold">已完成委托:</span> {volunteer.completedTasks}
                    </div>
                    <div>
                      <span className="font-semibold">註冊時間:</span>{" "}
                      {formatDate(volunteer.createdAt)}
                    </div>
                  </div>

                  {volunteer.fields && volunteer.fields.length > 0 && (
                    <div>
                      <span className="font-semibold">服務範疇:</span>{" "}
                      {volunteer.fields.join(", ")}
                    </div>
                  )}

                  {volunteer.skills && volunteer.skills.length > 0 && (
                    <div>
                      <span className="font-semibold">技能:</span> {volunteer.skills.join(", ")}
                    </div>
                  )}

                  {volunteer.goals && (
                    <div>
                      <span className="font-semibold">目標:</span>
                      <p className="text-sm text-muted-foreground mt-1">{volunteer.goals}</p>
                    </div>
                  )}

                  {volunteer.status === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleStatusChange(volunteer.uid, "approved")}
                        className="flex-1"
                      >
                        批准
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange(volunteer.uid, "rejected")}
                        className="flex-1"
                      >
                        拒絕
                      </Button>
                    </div>
                  )}

                  {volunteer.status === "approved" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange(volunteer.uid, "suspended")}
                      >
                        暫停帳號
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

