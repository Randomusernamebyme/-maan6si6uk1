import { RegisterForm } from "@/components/auth/RegisterForm"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">萬事屋平台</h1>
          <p className="text-muted-foreground mt-2">加入我們，幫助社區</p>
        </div>
        <RegisterForm />
        <div className="text-center text-sm">
          <span className="text-muted-foreground">已有帳號？</span>{" "}
          <Link href="/login" className="text-primary hover:underline">
            立即登入
          </Link>
        </div>
      </div>
    </div>
  )
}

