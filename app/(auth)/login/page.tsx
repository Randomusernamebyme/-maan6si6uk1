import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登入</CardTitle>
          <CardDescription>登入您的萬事屋帳號</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            還沒有帳號？{" "}
            <Link href="/register" className="text-foreground underline hover:text-foreground/80">
              立即註冊
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

