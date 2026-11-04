import { Metadata } from "next";
import { Navbar } from "@/app/components/ui/Navbar";
import HeroSection from "@/components/fintera/hero-section";
import FeaturesSection from "@/components/fintera/features-section";
import PrequalificationSection from "@/components/fintera/prequalification-section";
import TrustSection from "@/components/fintera/trust-section";
import HowItWorksSection from "@/components/fintera/how-it-works-section";
import SocialProofSection from "@/components/fintera/social-proof-section";
import InsightsShowcaseSection from "@/components/fintera/insights-showcase-section";
import CTASection from "@/components/fintera/cta-section";
import Footer from "@/components/fintera/footer";

export const metadata: Metadata = {
  title: "FINTERA | Soluciones Financieras para Personas y Empresas en Colombia",
  description: "Conectamos personas y empresas con soluciones financieras en Colombia mediante orientación especializada, criterio financiero, acompañamiento y transparencia. Crédito de vivienda y soluciones empresariales.",
  keywords: ["credito colombia", "credito vivienda", "leasing habitacional", "soluciones empresariales", "factoring colombia", "fintera soluciones financieras"],
  authors: [{ name: "Fintera" }],
  openGraph: {
    title: "FINTERA | Hagamos posible tu próximo proyecto",
    description: "Conectamos personas y empresas con soluciones financieras mediante orientación especializada y acompañamiento.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Prequalification Section */}
      <PrequalificationSection />
      
      {/* Trust & Value Proposition Section */}
      <TrustSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Social Proof Section */}
      <SocialProofSection />

      {/* FINTERA Insights & Research Showcase Section */}
      <InsightsShowcaseSection />
      
      {/* Call to Action Section */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
      </main>
    </>
  );
}
