import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { MarketPreview } from "@/components/landing/market-preview";
import { ScoringSection } from "@/components/landing/scoring-section";
import { ExecutionSection } from "@/components/landing/execution-section";
import { ApiSection } from "@/components/landing/api-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <MarketPreview />
        <ScoringSection />
        <ExecutionSection />
        <ApiSection />
      </main>
      <SiteFooter />
    </>
  );
}
