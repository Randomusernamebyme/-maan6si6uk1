import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CTASection } from "@/components/home/CTASection";
import { RecentShowcaseSection } from "@/components/home/RecentShowcaseSection";

export default function Home() {
  // 所有用戶類型都顯示相同的首頁
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <ServicesSection />
      <Suspense fallback={null}>
        <RecentShowcaseSection />
      </Suspense>
      <StatsSection />
      <CTASection />
    </main>
  );
}
