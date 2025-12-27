"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            準備好加入我們了嗎？
          </h2>
          <p className="text-lg text-muted-foreground">
            無論您是需要幫助的委托者，還是願意提供服務的義工，
            我們都歡迎您加入堅城萬事屋的大家庭。
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

