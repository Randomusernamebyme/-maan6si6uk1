import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/firebase/auth-server"

export default async function Home() {
  const user = await getServerSession()
  
  if (!user) {
    redirect("/login")
  }
  
  if (user.role === "admin") {
    redirect("/admin")
  }
  
  redirect("/volunteer")
}

