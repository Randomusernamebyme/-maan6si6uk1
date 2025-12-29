"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CTASection } from "@/components/home/CTASection";
import { LoadingPage } from "@/components/ui/loading";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // 登入後重定向到對應的dashboard
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "volunteer") {
        router.push("/volunteer/dashboard");
      }
    }
  }, [user, loading, router]);

  // 如果正在載入或已登入，顯示載入頁面（重定向中）
  if (loading || user) {
    return <LoadingPage />;
  }

  // 未登入時顯示首頁
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <CTASection />
    </main>
  );
}
