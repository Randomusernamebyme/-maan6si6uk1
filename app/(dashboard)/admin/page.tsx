"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { logout } from "@/lib/firebase/auth"
import { subscribeToRequests, getUsers, getApplicationsByRequest } from "@/lib/firebase/firestore"
import { Request, User, Application } from "@/types"
import { RequestCard } from "@/components/requests/RequestCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [volunteers, setVolunteers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalVolunteers: 0,
    pendingVolunteers: 0,
  })

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
      // 訂閱所有委托
      const unsubscribeRequests = subscribeToRequests((data) => {
        setRequests(data)
        setStats((prev) => ({
          ...prev,
          totalRequests: data.length,
          pendingRequests: data.filter((r) => r.status === "pending").length,
        }))
      })

      // 載入義工列表
      loadVolunteers()

      return () => {
        unsubscribeRequests()
      }
    }
  }, [user, loading, router])

  const loadVolunteers = async () => {
    try {
      const data = await getUsers("volunteer")
      setVolunteers(data)
      setStats((prev) => ({
        ...prev,
        totalVolunteers: data.length,
        pendingVolunteers: data.filter((v) => v.status === "pending").length,
      }))
    } catch (error) {
      console.error("載入義工列表失敗:", error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
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
          <h1 className="text-2xl font-bold">萬事屋平台 - 管理後台</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              管理員: {user.displayName}
            </span>
            <Link href="/admin/requests">
              <Button variant="outline">委托管理</Button>
            </Link>
            <Link href="/admin/volunteers">
              <Button variant="outline">義工管理</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">統計資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">總委托數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">待處理委托</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.pendingRequests}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">總義工數</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalVolunteers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">待審核義工</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.pendingVolunteers}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">最近委托</TabsTrigger>
            <TabsTrigger value="volunteers">待審核義工</TabsTrigger>
          </TabsList>
          <TabsContent value="requests">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.slice(0, 6).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  showRequester={true}
                  showActions={false}
                />
              ))}
            </div>
            {requests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">目前沒有委托</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="volunteers">
            <div className="space-y-4">
              {volunteers
                .filter((v) => v.status === "pending")
                .slice(0, 10)
                .map((volunteer) => (
                  <Card key={volunteer.uid}>
                    <CardHeader>
                      <CardTitle>{volunteer.displayName}</CardTitle>
                      <CardDescription>{volunteer.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">電話:</span> {volunteer.phone}
                        </div>
                        <div>
                          <span className="font-semibold">年齡:</span> {volunteer.age}
                        </div>
                        <div>
                          <span className="font-semibold">服務範疇:</span>{" "}
                          {volunteer.fields?.join(", ")}
                        </div>
                        {volunteer.skills && volunteer.skills.length > 0 && (
                          <div>
                            <span className="font-semibold">技能:</span>{" "}
                            {volunteer.skills.join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link href={`/admin/volunteers/${volunteer.uid}`}>
                          <Button>查看詳情</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {volunteers.filter((v) => v.status === "pending").length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">沒有待審核的義工</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

