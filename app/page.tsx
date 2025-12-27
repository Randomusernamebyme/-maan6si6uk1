import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { StatsSection } from "@/components/home/StatsSection";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { CTASection } from "@/components/home/CTASection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <InstagramFeed />
      <CTASection />
    </main>
  );
}
