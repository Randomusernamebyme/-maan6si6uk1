"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/AuthContext"
import { updateUser } from "@/lib/firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    age: "",
    skills: "",
    goals: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      setFormData({
        displayName: user.displayName || "",
        phone: user.phone || "",
        age: user.age || "",
        skills: user.skills?.join(", ") || "",
        goals: user.goals || "",
      })
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      await updateUser(user.uid, {
        displayName: formData.displayName,
        phone: formData.phone,
        age: formData.age,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        goals: formData.goals,
      })
      await refreshUser()
      alert("個人資料已更新")
    } catch (error) {
      console.error("更新失敗:", error)
      alert("更新失敗，請稍後再試")
    } finally {
      setSaving(false)
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">個人資料</h1>
          <Link href="/volunteer">
            <Button variant="outline">返回儀表板</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>個人資料</CardTitle>
            <CardDescription>更新您的個人資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="displayName">稱呼</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">電話號碼</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="age">年齡</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="skills">技能</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  placeholder="用逗號分隔多個技能"
                />
              </div>

              <div>
                <Label htmlFor="goals">目標</Label>
                <textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) =>
                    setFormData({ ...formData, goals: e.target.value })
                  }
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="請分享您的目標..."
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "儲存中..." : "儲存變更"}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold mb-4">帳號資訊</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">電子郵件:</span>{" "}
                  {user.email}
                </div>
                <div>
                  <span className="text-muted-foreground">狀態:</span>{" "}
                  {user.status === "approved" ? "已審核" : "待審核"}
                </div>
                <div>
                  <span className="text-muted-foreground">服務範疇:</span>{" "}
                  {user.fields?.join(", ") || "無"}
                </div>
                <div>
                  <span className="text-muted-foreground">已完成委托:</span>{" "}
                  {user.completedTasks}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

