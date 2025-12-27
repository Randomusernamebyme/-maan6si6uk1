"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateDocument } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    phone: user?.phone || "",
    age: user?.age || "",
    skills: user?.skills?.join(", ") || "",
    availability: user?.availability?.join(", ") || "",
    targetAudience: user?.targetAudience?.join(", ") || "",
    goals: user?.goals || "",
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      await updateDocument("users", user.uid, {
        displayName: formData.displayName,
        phone: formData.phone,
        age: formData.age,
        skills: formData.skills
          ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        availability: formData.availability
          ? formData.availability.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        targetAudience: formData.targetAudience
          ? formData.targetAudience.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        goals: formData.goals || undefined,
      });

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">個人資料</h2>
        <p className="text-muted-foreground">管理您的個人資訊</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorDisplay message={error} />}
            {success && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
                資料更新成功！
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">電子郵件無法修改</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">稱呼 *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話號碼 (WhatsApp) *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">年齡 *</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fields">服務範疇</Label>
              <div className="flex flex-wrap gap-2">
                {user.fields?.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">服務範疇無法修改</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">技能（用逗號分隔）</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="例如：電腦維修, 搬運, 傾聽"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">空閒日子（用逗號分隔）</Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) =>
                  setFormData({ ...formData, availability: e.target.value })
                }
                placeholder="例如：星期一, 星期六"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">服務對象（用逗號分隔）</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                placeholder="例如：長者, 兒童"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">目標</Label>
              <textarea
                id="goals"
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
                placeholder="您想透過萬事屋完成的目標"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? <Loading size="sm" /> : "儲存變更"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>帳號狀態</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">狀態：</span>
            <span>
              {user.status === "approved"
                ? "已審核"
                : user.status === "pending"
                ? "待審核"
                : user.status === "rejected"
                ? "已拒絕"
                : user.status === "suspended"
                ? "已暫停"
                : user.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">完成的委托數：</span>
            <span>{user.completedTasks || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

