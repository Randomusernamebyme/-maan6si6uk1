 "use client";

 import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { useAuth } from "@/lib/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { ErrorDisplay } from "@/components/ui/error";
 import { Loading } from "@/components/ui/loading";

 export default function ForgotPasswordPage() {
   const router = useRouter();
   const { sendPasswordReset } = useAuth();
   const [email, setEmail] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string>("");
   const [success, setSuccess] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       setError("");
       setSuccess(false);
       setLoading(true);
       await sendPasswordReset(email);
       setSuccess(true);
     } catch (err: any) {
       setError(err.message || "發送失敗，請稍後再試");
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className="min-h-[60vh] flex items-center justify-center px-4">
       <div className="w-full max-w-md space-y-6">
         <div className="space-y-2 text-center">
           <h1 className="text-2xl font-bold">找回密碼</h1>
           <p className="text-sm text-muted-foreground">
             請輸入你註冊時使用的電郵，我們會發送一封重設密碼的電郵給你。
           </p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
           {error && <ErrorDisplay message={error} />}
           {success && (
             <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
               密碼重置電郵已發送，請檢查你的收件箱（包括垃圾郵件）。
             </div>
           )}

           <div className="space-y-2">
             <Label htmlFor="email">電子郵件</Label>
             <Input
               id="email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="your@email.com"
               className="bg-background"
               required
             />
           </div>

           <Button type="submit" className="w-full" disabled={loading || !email}>
             {loading ? <Loading size="sm" /> : "發送重設密碼電郵"}
           </Button>

           <Button
             type="button"
             variant="outline"
             className="w-full"
             onClick={() => router.push("/login")}
           >
             返回登入頁
           </Button>
         </form>
       </div>
     </div>
   );
 }

