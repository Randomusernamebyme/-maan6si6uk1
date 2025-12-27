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
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorDisplay } from "@/components/ui/error";
import { Loading } from "@/components/ui/loading";
import { ServiceField } from "@/types";

const registerSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
  confirmPassword: z.string().min(6, "請確認密碼"),
  displayName: z.string().min(1, "請輸入您的稱呼"),
  phone: z.string().min(1, "請輸入電話號碼"),
  age: z.enum(["12-17", "18-24"], {
    required_error: "請選擇年齡範圍",
  }),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個服務範疇"),
  skills: z.array(z.string()).optional(),
  availability: z.array(z.string()).min(1, "請至少選擇一個空閒日子"),
  targetAudience: z.array(z.string()).optional(),
  goals: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

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

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [otherSkill, setOtherSkill] = useState("");
  const [otherAudience, setOtherAudience] = useState("");

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
      skills: [],
      availability: [],
      targetAudience: [],
    },
  });

  const selectedFields = watch("fields") || [];
  const selectedSkills = watch("skills") || [];
  const selectedAvailability = watch("availability") || [];
  const selectedAudience = watch("targetAudience") || [];

  const toggleField = (field: ServiceField) => {
    const currentFields = watch("fields") || [];
    const newFields = currentFields.includes(field)
      ? currentFields.filter((f) => f !== field)
      : [...currentFields, field];
    setValue("fields", newFields as any, { shouldValidate: true });
  };

  const toggleSkill = (skill: string) => {
    const currentSkills = watch("skills") || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    setValue("skills", newSkills as any, { shouldValidate: true });
  };

  const toggleAvailability = (day: string) => {
    const current = watch("availability") || [];
    const newAvailability = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setValue("availability", newAvailability as any, { shouldValidate: true });
  };

  const toggleAudience = (audience: string) => {
    const current = watch("targetAudience") || [];
    const newAudience = current.includes(audience)
      ? current.filter((a) => a !== audience)
      : [...current, audience];
    setValue("targetAudience", newAudience as any, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError("");
      setLoading(true);

      // 處理其他技能和對象
      const skillsArray = [...(data.skills || [])];
      if (otherSkill.trim()) {
        skillsArray.push(otherSkill.trim());
      }

      const audienceArray = [...(data.targetAudience || [])];
      if (otherAudience.trim()) {
        audienceArray.push(otherAudience.trim());
      }

      await registerUser(data.email, data.password, {
        displayName: data.displayName,
        phone: data.phone,
        age: data.age,
        fields: data.fields,
        skills: skillsArray,
        availability: data.availability,
        targetAudience: audienceArray,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorDisplay message={error} />}

      <div className="space-y-2">
        <Label htmlFor="email">電子郵件 *</Label>
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
        <Label htmlFor="password">密碼 *</Label>
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
        <Label htmlFor="confirmPassword">確認密碼 *</Label>
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
        <Label htmlFor="displayName">點樣稱呼你？ *</Label>
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
        <Label htmlFor="phone">電話號碼 (WhatsApp) *</Label>
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
        <Label>年齡 *</Label>
        <div className="space-y-2">
          {AGE_RANGES.map((age) => (
            <div key={age} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`age-${age}`}
                value={age}
                {...register("age")}
                className="h-4 w-4"
              />
              <Label htmlFor={`age-${age}`} className="font-normal cursor-pointer">
                {age}
              </Label>
            </div>
          ))}
        </div>
        {errors.age && (
          <p className="text-sm text-destructive">{errors.age.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>幫助範疇 *</Label>
        <p className="text-sm text-muted-foreground mb-2">
          我哋有社區拍檔、街坊樹窿、同埋生活助手，你認為自己適合加入邊一/幾個範疇？
        </p>
        <div className="space-y-2">
          {SERVICE_FIELDS.map((field) => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field}`}
                checked={selectedFields.includes(field)}
                onCheckedChange={() => toggleField(field)}
              />
              <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">
                {field}
              </Label>
            </div>
          ))}
        </div>
        {errors.fields && (
          <p className="text-sm text-destructive">{errors.fields.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>你想提供的技能？ *</Label>
        <div className="space-y-2">
          {SKILLS.map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${skill}`}
                checked={selectedSkills.includes(skill)}
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
              checked={selectedSkills.includes("Other")}
              onCheckedChange={(checked) => {
                if (checked) {
                  toggleSkill("Other");
                } else {
                  setValue(
                    "skills",
                    selectedSkills.filter((s) => s !== "Other") as any,
                    { shouldValidate: true }
                  );
                  setOtherSkill("");
                }
              }}
            />
            <Label htmlFor="skill-other" className="font-normal cursor-pointer">
              Other:
            </Label>
            {selectedSkills.includes("Other") && (
              <Input
                value={otherSkill}
                onChange={(e) => setOtherSkill(e.target.value)}
                placeholder="請輸入其他技能"
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
                checked={selectedAvailability.includes(day)}
                onCheckedChange={() => toggleAvailability(day)}
              />
              <Label htmlFor={`availability-${day}`} className="font-normal cursor-pointer">
                {day}
              </Label>
            </div>
          ))}
        </div>
        {errors.availability && (
          <p className="text-sm text-destructive">{errors.availability.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>你想服務的對象？ *</Label>
        <div className="space-y-2">
          {TARGET_AUDIENCE.map((audience) => (
            <div key={audience} className="flex items-center space-x-2">
              <Checkbox
                id={`audience-${audience}`}
                checked={selectedAudience.includes(audience)}
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
              checked={selectedAudience.includes("Other")}
              onCheckedChange={(checked) => {
                if (checked) {
                  toggleAudience("Other");
                } else {
                  setValue(
                    "targetAudience",
                    selectedAudience.filter((a) => a !== "Other") as any,
                    { shouldValidate: true }
                  );
                  setOtherAudience("");
                }
              }}
            />
            <Label htmlFor="audience-other" className="font-normal cursor-pointer">
              Other:
            </Label>
            {selectedAudience.includes("Other") && (
              <Input
                value={otherAudience}
                onChange={(e) => setOtherAudience(e.target.value)}
                placeholder="請輸入其他對象"
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
          {...register("goals")}
          placeholder="請輸入您的目標"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loading size="sm" /> : "註冊"}
      </Button>
    </form>
  );
}
