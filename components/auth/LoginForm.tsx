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

const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, sendPasswordReset } = useAuth();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError("");
      setLoading(true);
      await login(data.email, data.password);
      // 根據用戶角色重定向
      router.push("/volunteer/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "登入失敗，請檢查您的帳號密碼");
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">密碼</Label>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            忘記密碼？
          </button>
        </div>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className="bg-background"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loading size="sm" /> : "登入"}
      </Button>

      {showForgotPassword && (
        <div className="mt-4 p-4 border rounded-md space-y-3">
          <h3 className="font-semibold">忘記密碼</h3>
          {resetSuccess ? (
            <div className="text-sm text-green-600 dark:text-green-400">
              密碼重置郵件已發送到您的郵箱，請檢查您的收件箱。
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="resetEmail">電子郵件</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetSuccess(false);
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      setResetLoading(true);
                      setError("");
                      await sendPasswordReset(resetEmail);
                      setResetSuccess(true);
                    } catch (err: any) {
                      setError(err.message || "發送失敗，請稍後再試");
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  disabled={resetLoading || !resetEmail}
                  className="flex-1"
                >
                  {resetLoading ? <Loading size="sm" /> : "發送重置郵件"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </form>
  );
}

