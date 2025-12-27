"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { register as registerUser } from "@/lib/firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceField } from "@/types"

const registerSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
  confirmPassword: z.string(),
  displayName: z.string().min(1, "請輸入您的稱呼"),
  phone: z.string().min(1, "請輸入電話號碼"),
  age: z.string().min(1, "請輸入年齡"),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個服務範疇"),
  skills: z.string().optional(),
  availability: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  goals: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"]
const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
const TARGET_AUDIENCES = ["長者", "兒童", "青少年", "家庭", "其他"]

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      phone: "",
      age: "",
      fields: [],
      skills: "",
      availability: [],
      targetAudience: [],
      goals: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setError("")
    setLoading(true)

    try {
      await registerUser(data.email, data.password, {
        role: "volunteer",
        displayName: data.displayName,
        phone: data.phone,
        age: data.age,
        fields: data.fields,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()) : [],
        availability: data.availability || [],
        targetAudience: data.targetAudience || [],
        goals: data.goals,
      })
      router.push("/volunteer")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>義工註冊</CardTitle>
        <CardDescription>歡迎加入萬事屋平台！請填寫以下資料</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子郵件 *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>點樣稱呼你? *</FormLabel>
                    <FormControl>
                      <Input placeholder="您的稱呼" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密碼 *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>確認密碼 *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話號碼 (WhatsApp) *</FormLabel>
                    <FormControl>
                      <Input placeholder="+852 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年齡 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如: 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服務範疇 *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {SERVICE_FIELDS.map((fieldValue) => (
                      <label
                        key={fieldValue}
                        className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(fieldValue)}
                          onChange={(e) => {
                            const value = field.value
                            if (e.target.checked) {
                              field.onChange([...value, fieldValue])
                            } else {
                              field.onChange(value.filter((v) => v !== fieldValue))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{fieldValue}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>你想提供職技能</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: 電腦維修, 搬運, 傾聽" {...field} />
                  </FormControl>
                  <FormDescription>請用逗號分隔多個技能</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>一星期內比較空間的日子</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {WEEKDAYS.map((day) => (
                      <label
                        key={day}
                        className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(day)}
                          onChange={(e) => {
                            const value = field.value || []
                            if (e.target.checked) {
                              field.onChange([...value, day])
                            } else {
                              field.onChange(value.filter((v) => v !== day))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>想服務職對象</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TARGET_AUDIENCES.map((audience) => (
                      <label
                        key={audience}
                        className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(audience)}
                          onChange={(e) => {
                            const value = field.value || []
                            if (e.target.checked) {
                              field.onChange([...value, audience])
                            } else {
                              field.onChange(value.filter((v) => v !== audience))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{audience}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>想辱萬事屋完成職目標</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="請分享您的目標..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "註冊中..." : "註冊"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

