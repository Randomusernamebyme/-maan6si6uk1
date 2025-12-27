"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorDisplay } from "@/components/ui/error";
import { Loading } from "@/components/ui/loading";
import { ServiceField } from "@/types";

const registerSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
  confirmPassword: z.string().min(6, "請確認密碼"),
  displayName: z.string().min(1, "請輸入您的稱呼"),
  phone: z.string().min(1, "請輸入電話號碼"),
  age: z.string().min(1, "請輸入年齡"),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個服務範疇"),
  skills: z.string().optional(),
  availability: z.string().optional(),
  targetAudience: z.string().optional(),
  goals: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"];

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fields: [],
    },
  });

  const selectedFields = watch("fields") || [];

  const toggleField = (field: ServiceField) => {
    const currentFields = watch("fields") || [];
    const newFields = currentFields.includes(field)
      ? currentFields.filter((f) => f !== field)
      : [...currentFields, field];
    setValue("fields", newFields as any, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError("");
      setLoading(true);

      // 處理多選欄位
      const skillsArray = data.skills ? data.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const availabilityArray = data.availability
        ? data.availability.split(",").map((a) => a.trim()).filter(Boolean)
        : [];
      const targetAudienceArray = data.targetAudience
        ? data.targetAudience.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await registerUser(data.email, data.password, {
        displayName: data.displayName,
        phone: data.phone,
        age: data.age,
        fields: data.fields,
        skills: skillsArray,
        availability: availabilityArray,
        targetAudience: targetAudienceArray,
        goals: data.goals,
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <ErrorDisplay message={error} />}

      <div className="space-y-2">
        <Label htmlFor="email">電子郵件</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="your@email.com"
          className="bg-background"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder="至少 6 個字元"
          className="bg-background"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">確認密碼</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          placeholder="再次輸入密碼"
          className="bg-background"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">點樣稱呼你？</Label>
        <Input
          id="displayName"
          {...register("displayName")}
          placeholder="您的稱呼"
          className="bg-background"
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">電話號碼 (WhatsApp)</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="您的電話號碼"
          className="bg-background"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">年齡</Label>
        <Input
          id="age"
          {...register("age")}
          placeholder="您的年齡"
          className="bg-background"
        />
        {errors.age && (
          <p className="text-sm text-destructive">{errors.age.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>服務範疇（可多選）</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_FIELDS.map((field) => (
            <Button
              key={field}
              type="button"
              variant={selectedFields.includes(field) ? "default" : "outline"}
              onClick={() => toggleField(field)}
              className="bg-background"
            >
              {field}
            </Button>
          ))}
        </div>
        {errors.fields && (
          <p className="text-sm text-destructive">{errors.fields.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">你想提供的技能（用逗號分隔）</Label>
        <Input
          id="skills"
          {...register("skills")}
          placeholder="例如：電腦維修, 搬運, 傾聽"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="availability">一星期內比較空間的日子（用逗號分隔）</Label>
        <Input
          id="availability"
          {...register("availability")}
          placeholder="例如：星期一, 星期六"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAudience">想服務的對象（用逗號分隔）</Label>
        <Input
          id="targetAudience"
          {...register("targetAudience")}
          placeholder="例如：長者, 兒童"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goals">想透過萬事屋完成的目標（選填）</Label>
        <Input
          id="goals"
          {...register("goals")}
          placeholder="您的目標"
          className="bg-background"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loading size="sm" /> : "註冊"}
      </Button>
    </form>
  );
}

