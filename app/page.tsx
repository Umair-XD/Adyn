import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { GrowthFeatures } from "@/components/landing/growth-features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { SocialProof } from "@/components/landing/social-proof";
import { Pricing } from "@/components/landing/pricing";
import { FaqCta } from "@/components/landing/faq-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020817] selection:bg-orange-500/30">
      <Navbar />
      <Hero />
      <DashboardPreview />
      <GrowthFeatures />
      <HowItWorks />
      <ProductShowcase />
      <ComparisonTable />
      <SocialProof />
      <Pricing />
      <FaqCta />
      <Footer />
    </main>
  );
}