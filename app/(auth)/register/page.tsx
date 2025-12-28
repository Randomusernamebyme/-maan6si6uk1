import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">註冊成為義工</CardTitle>
          <CardDescription>填寫以下資料完成註冊</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            已有帳號？{" "}
            <Link href="/login" className="text-foreground underline hover:text-foreground/80">
              立即登入
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


