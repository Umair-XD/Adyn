import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020817] selection:bg-orange-500/30">
      <Navbar />
      <Hero />
      <DashboardPreview />
      <Footer />
    </main>
  );
}