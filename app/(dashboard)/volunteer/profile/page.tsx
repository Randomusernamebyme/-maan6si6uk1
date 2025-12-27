"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import { ServiceField } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "請輸入當前密碼"),
    newPassword: z
      .string()
      .min(8, "密碼至少需要 8 個字元")
      .regex(/[a-zA-Z]/, "密碼必須包含至少一個字母")
      .regex(/[0-9]/, "密碼必須包含至少一個數字"),
    confirmPassword: z.string().min(8, "請確認新密碼"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新密碼不一致",
    path: ["confirmPassword"],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

function PasswordChangeForm() {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      await changePassword(data.currentPassword, data.newPassword);

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "修改密碼失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <ErrorDisplay message={error} />}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
          密碼修改成功！
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">當前密碼</Label>
        <Input
          id="currentPassword"
          type="password"
          {...register("currentPassword")}
          className="bg-background"
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">新密碼</Label>
        <Input
          id="newPassword"
          type="password"
          {...register("newPassword")}
          className="bg-background"
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          至少 8 個字元，包含字母和數字
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">確認新密碼</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="bg-background"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <Loading size="sm" /> : "修改密碼"}
      </Button>
    </form>
  );
}

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"];
const AGE_RANGES = ["12-17", "18-24"] as const;
const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"] as const;
const SKILLS = [
  "唱歌",
  "跳舞",
  "煮嘢食",
  "玩音樂",
  "清潔",
  "傾偈",
  "情緒支援",
  "維修物件",
] as const;
const TARGET_AUDIENCE = [
  "兒童",
  "年輕人",
  "成年人",
  "長者",
  "少數族裔",
] as const;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    age: "" as "12-17" | "18-24" | "",
    fields: [] as ServiceField[],
    skills: [] as string[],
    availability: [] as string[],
    targetAudience: [] as string[],
    goals: "",
    otherSkill: "",
    otherAudience: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        phone: user.phone || "",
        age: (user.age as "12-17" | "18-24") || "",
        fields: user.fields || [],
        skills: user.skills || [],
        availability: user.availability || [],
        targetAudience: user.targetAudience || [],
        goals: user.goals || "",
        otherSkill: "",
        otherAudience: "",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  const toggleField = (field: ServiceField) => {
    const newFields = formData.fields.includes(field)
      ? formData.fields.filter((f) => f !== field)
      : [...formData.fields, field];
    setFormData({ ...formData, fields: newFields });
  };

  const toggleSkill = (skill: string) => {
    const newSkills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData({ ...formData, skills: newSkills });
  };

  const toggleAvailability = (day: string) => {
    const newAvailability = formData.availability.includes(day)
      ? formData.availability.filter((d) => d !== day)
      : [...formData.availability, day];
    setFormData({ ...formData, availability: newAvailability });
  };

  const toggleAudience = (audience: string) => {
    const newAudience = formData.targetAudience.includes(audience)
      ? formData.targetAudience.filter((a) => a !== audience)
      : [...formData.targetAudience, audience];
    setFormData({ ...formData, targetAudience: newAudience });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.fields.length === 0) {
      setError("請至少選擇一個服務範疇");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      // 過濾掉 "Other"，只保留實際技能
      const skillsArray = formData.skills.filter((s) => s !== "Other");
      // 處理多個其他技能（用逗號分隔）
      if (formData.otherSkill.trim()) {
        const otherSkills = formData.otherSkill
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        skillsArray.push(...otherSkills);
      }

      // 過濾掉 "Other"，只保留實際對象
      const audienceArray = formData.targetAudience.filter((a) => a !== "Other");
      // 處理多個其他對象（用逗號分隔）
      if (formData.otherAudience.trim()) {
        const otherAudiences = formData.otherAudience
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
        audienceArray.push(...otherAudiences);
      }

      // 準備更新數據，只包含有值的欄位
      const updateData: any = {
        displayName: formData.displayName,
        phone: formData.phone,
        age: formData.age,
        fields: formData.fields,
        skills: skillsArray,
        availability: formData.availability,
        targetAudience: audienceArray,
      };

      // 只有當 goals 有值時才添加
      if (formData.goals && formData.goals.trim()) {
        updateData.goals = formData.goals.trim();
      }

      await updateDocument("users", user.uid, updateData);

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      setError("");

      // 刪除 Firestore 用戶資料
      await deleteDocument("users", user.uid);

      // 登出並重定向到首頁
      await logout();
      router.push("/");
      alert("帳號資料已成功刪除。");
    } catch (err: any) {
      setError(err.message || "刪除帳號失敗，請稍後再試");
      setDeleting(false);
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label>年齡 *</Label>
              <div className="space-y-2">
                {AGE_RANGES.map((age) => (
                  <div key={age} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`age-${age}`}
                      name="age"
                      value={age}
                      checked={formData.age === age}
                      onChange={() => setFormData({ ...formData, age: age as "12-17" | "18-24" })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`age-${age}`} className="font-normal cursor-pointer">
                      {age}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>服務範疇 *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                我哋有社區拍檔、街坊樹窿、同埋生活助手，你認為自己適合加入邊一/幾個範疇？
              </p>
              <div className="space-y-2">
                {SERVICE_FIELDS.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${field}`}
                      checked={formData.fields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>你想提供的技能？</Label>
              <div className="space-y-2">
                {SKILLS.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={formData.skills.includes(skill)}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <Label htmlFor={`skill-${skill}`} className="font-normal cursor-pointer">
                      {skill}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skill-other"
                    checked={formData.skills.includes("Other")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        toggleSkill("Other");
                      } else {
                        setFormData({
                          ...formData,
                          skills: formData.skills.filter((s) => s !== "Other"),
                          otherSkill: "",
                        });
                      }
                    }}
                  />
                  <Label htmlFor="skill-other" className="font-normal cursor-pointer">
                    Other:
                  </Label>
                  {formData.skills.includes("Other") && (
                    <Input
                      value={formData.otherSkill}
                      onChange={(e) => setFormData({ ...formData, otherSkill: e.target.value })}
                      placeholder="請輸入其他技能（多個技能請用逗號分隔）"
                      className="bg-background flex-1"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>一星期內你比較空閒的日子 *</Label>
              <div className="space-y-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`availability-${day}`}
                      checked={formData.availability.includes(day)}
                      onCheckedChange={() => toggleAvailability(day)}
                    />
                    <Label htmlFor={`availability-${day}`} className="font-normal cursor-pointer">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>你想服務的對象？</Label>
              <div className="space-y-2">
                {TARGET_AUDIENCE.map((audience) => (
                  <div key={audience} className="flex items-center space-x-2">
                    <Checkbox
                      id={`audience-${audience}`}
                      checked={formData.targetAudience.includes(audience)}
                      onCheckedChange={() => toggleAudience(audience)}
                    />
                    <Label htmlFor={`audience-${audience}`} className="font-normal cursor-pointer">
                      {audience}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audience-other"
                    checked={formData.targetAudience.includes("Other")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        toggleAudience("Other");
                      } else {
                        setFormData({
                          ...formData,
                          targetAudience: formData.targetAudience.filter((a) => a !== "Other"),
                          otherAudience: "",
                        });
                      }
                    }}
                  />
                  <Label htmlFor="audience-other" className="font-normal cursor-pointer">
                    Other:
                  </Label>
                  {formData.targetAudience.includes("Other") && (
                    <Input
                      value={formData.otherAudience}
                      onChange={(e) => setFormData({ ...formData, otherAudience: e.target.value })}
                      placeholder="請輸入其他對象（多個對象請用逗號分隔）"
                      className="bg-background flex-1"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">(如有) 你想喺「堅城萬事屋」完成的目標？</Label>
              <textarea
                id="goals"
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
                placeholder="請輸入您的目標"
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

      <Card>
        <CardHeader>
          <CardTitle>修改密碼</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">危險區域</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            刪除帳號將永久移除您的所有資料，此操作無法復原。
          </p>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">刪除帳號</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>確認刪除帳號</DialogTitle>
                <DialogDescription>
                  您確定要刪除帳號嗎？此操作將永久刪除您的所有資料，包括：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>個人資料</li>
                    <li>報名記錄</li>
                    <li>所有相關數據</li>
                  </ul>
                  此操作無法復原。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? <Loading size="sm" /> : "確認刪除"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
