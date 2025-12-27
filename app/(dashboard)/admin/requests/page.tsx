"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { subscribeToRequests, updateRequest, getApplicationsByRequest } from "@/lib/firebase/firestore"
import { Request, Application } from "@/types"
import { RequestCard } from "@/components/requests/RequestCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RequestsManagementPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [applications, setApplications] = useState<Application[]>([])

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
      const unsubscribe = subscribeToRequests((data) => {
        setRequests(data)
      })

      return () => unsubscribe()
    }
  }, [user, loading, router])

  const loadApplications = async (requestId: string) => {
    try {
      const data = await getApplicationsByRequest(requestId)
      setApplications(data)
    } catch (error) {
      console.error("載入報名記錄失敗:", error)
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: Request["status"]) => {
    try {
      await updateRequest(requestId, { status: newStatus })
    } catch (error) {
      console.error("更新狀態失敗:", error)
      alert("更新失敗，請稍後再試")
    }
  }

  const handleViewApplications = (request: Request) => {
    setSelectedRequest(request)
    loadApplications(request.id)
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">委托管理</h1>
            <div className="flex gap-2">
            <Link href="/admin/requests/create">
              <Button>創建新委托</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">返回儀表板</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">委托 #{request.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      {new Date(request.createdAt).toLocaleDateString("zh-TW")}
                    </CardDescription>
                  </div>
                  <Badge>{request.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <RequestCard request={request} showRequester={true} showActions={false} />

                <div className="space-y-2">
                  <label className="text-sm font-semibold">狀態</label>
                  <Select
                    value={request.status}
                    onValueChange={(value) =>
                      handleStatusChange(request.id, value as Request["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待配對</SelectItem>
                      <SelectItem value="matched">已配對</SelectItem>
                      <SelectItem value="in_progress">進行中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewApplications(request)}
                    >
                      查看報名 ({applications.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>報名記錄</DialogTitle>
                      <DialogDescription>
                        委托 #{selectedRequest?.id.slice(0, 8)} 的報名記錄
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {applications.length === 0 ? (
                        <p className="text-muted-foreground">目前沒有報名記錄</p>
                      ) : (
                        applications.map((app) => (
                          <Card key={app.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">{app.volunteerName}</CardTitle>
                              <CardDescription>狀態: {app.status}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {app.message && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {app.message}
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={async () => {
                                  // TODO: 實現接受/拒絕報名的邏輯
                                  alert("功能開發中")
                                }}
                              >
                                接受報名
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">目前沒有委托</p>
          </div>
        )}
      </main>
    </div>
  )
}

