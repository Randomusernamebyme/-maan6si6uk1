"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { getApplicationsByVolunteer } from "@/lib/firebase/firestore"
import { Application } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const statusColors: Record<Application["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
}

const statusLabels: Record<Application["status"], string> = {
  pending: "待審核",
  accepted: "已接受",
  rejected: "已拒絕",
  completed: "已完成",
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadApplications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router])

  const loadApplications = async () => {
    if (!user) return
    try {
      const data = await getApplicationsByVolunteer(user.uid)
      setApplications(data)
    } catch (error) {
      console.error("載入報名記錄失敗:", error)
    } finally {
      setAppsLoading(false)
    }
  }

  if (loading || appsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">我的報名記錄</h1>
          <Link href="/volunteer">
            <Button variant="outline">返回儀表板</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">您還沒有報名任何委托</p>
            <Link href="/volunteer">
              <Button className="mt-4">瀏覽委托</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>委托 #{app.requestId.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        報名時間: {formatDate(app.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[app.status]}>
                      {statusLabels[app.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {app.message && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">我的留言</h4>
                      <p className="text-sm text-muted-foreground">{app.message}</p>
                    </div>
                  )}
                  {app.adminNotes && (
                    <div>
                      <h4 className="font-semibold mb-2">管理員備註</h4>
                      <p className="text-sm text-muted-foreground">{app.adminNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

