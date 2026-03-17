"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { HEADER_BRANDING, HERO_BRANDING } from "@/lib/constants/branding";

export function HeroSection() {
  const { user } = useAuth();
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          <h1 className="sr-only">{HERO_BRANDING.title}</h1>
          <div className="w-full">
            {HERO_BRANDING.heroUrl ? (
              <Image
                src={HERO_BRANDING.heroUrl}
                alt={HERO_BRANDING.title}
                width={HERO_BRANDING.width}
                height={HERO_BRANDING.height}
                className="w-full h-auto object-contain"
                priority
              />
            ) : (
              <p className="text-center text-5xl md:text-6xl font-bold tracking-tight">
                {HEADER_BRANDING.title}
              </p>
            )}
          </div>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto whitespace-pre-wrap">
              堅城萬事屋希望收集各位街坊朋友嘅委託，然之後透過招募義工同同事嘅力量去解決生活上嘅難題，無論係感情上、技術上定係社區連結方面，我哋都會關注。
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto whitespace-pre-wrap">
              我哋堅城萬事屋齊集各方精英，有陪你科技進步嘅河狸助手👷🏻🦫🛠️，有同你吹水談心嘅樹窿松鼠🩷🐿️💬，仲有一班對堅尼地城社區有熱誠嘅拍檔小仙子🧚🏻‍♀️🧚🏻🧚🏻‍♂️，同大家多方向解難💯！
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto whitespace-pre-wrap">
              無論你有難題想揾萬事屋，定係想發揮自己所長，堅城萬事屋都歡迎你成爲我哋一份子！
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/request">提交委托請求</Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="border-2">
                  <Link href="/register">成為義工</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

