"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { login } from "@/lib/firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件地址"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setError("")
    setLoading(true)

    try {
      await login(data.email, data.password)
      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "登入失敗，請檢查您的帳號密碼")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登入</CardTitle>
        <CardDescription>請輸入您的帳號和密碼</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電子郵件</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密碼</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

