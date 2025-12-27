import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold">堅城萬事屋</h1>
          <p className="text-xl text-muted-foreground">
            社區服務平台，連接需要幫助的委托者與願意提供服務的義工
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>生活助手</CardTitle>
              <CardDescription>河裡 - 全能工具人</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                幫助街坊解決生活難題：手機故障處理、修補舊衣舊鞋、執靚小窩、教用AI等
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>社區拍檔</CardTitle>
              <CardDescription>小仙子拍檔</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                聯繫社區形形色色的人，舉辦地區聯繫活動、保留社區特色文化
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>街坊樹窿</CardTitle>
              <CardDescription>小松鼠</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                提供情緒價值，聆聽心底秘密：上門陪玩、陪行街、陪睇醫生
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/login">登入</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2">
            <Link href="/register">註冊成為義工</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

