import { LoginForm } from "@/components/auth/LoginForm"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">萬事屋平台</h1>
          <p className="text-muted-foreground mt-2">社區服務平台</p>
        </div>
        <LoginForm />
        <div className="text-center text-sm">
          <span className="text-muted-foreground">還沒有帳號？</span>{" "}
          <Link href="/register" className="text-primary hover:underline">
            立即註冊
          </Link>
        </div>
      </div>
    </div>
  )
}

