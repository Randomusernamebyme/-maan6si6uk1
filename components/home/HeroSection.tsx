"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            堅城萬事屋
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            社區服務平台，連接需要幫助的委托者與願意提供服務的義工
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我們致力於為堅尼地城社區提供溫暖的支援服務，透過三大服務領域，
            幫助街坊解決生活難題，建立更緊密的社區聯繫。
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
              <Link href="/request">提交委托請求</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2">
              <Link href="/register">成為義工</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

