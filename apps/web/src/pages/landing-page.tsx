import { HeroSection } from "@/components/landing/hero-section";
import { ManifestoSection } from "@/components/landing/manifesto-section";
import { MarketPreview } from "@/components/landing/market-preview";
import { EdgeSection } from "@/components/landing/edge-section";
import { PipelineSection } from "@/components/landing/pipeline-section";
import { ScoringSection } from "@/components/landing/scoring-section";
import { ExecutionSection } from "@/components/landing/execution-section";
import { ApiSection } from "@/components/landing/api-section";

export function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ManifestoSection />
      <MarketPreview />
      <EdgeSection />
      <PipelineSection />
      <ScoringSection />
      <ExecutionSection />
      <ApiSection />
    </main>
  );
}
