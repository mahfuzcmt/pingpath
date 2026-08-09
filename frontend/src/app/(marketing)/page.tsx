import { Hero } from "@/components/marketing/Hero";
import { StatsSection } from "@/components/marketing/StatsSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { IndustryGrid } from "@/components/marketing/IndustryGrid";
import { TestimonialSection } from "@/components/marketing/TestimonialSection";
import { CTASection } from "@/components/marketing/CTASection";

export const metadata = {
  title: "MotoLink — GPS Fleet Tracking for Bangladesh",
  description: "Real-time GPS tracking solution built for Bangladesh. Monitor vehicles, reduce theft, and optimize your fleet operations. Bengali & English interface.",
};

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <FeatureGrid />
      <IndustryGrid />
      <TestimonialSection />
      <CTASection />
    </>
  );
}
