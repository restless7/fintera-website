import { Metadata } from "next";
import HeroSection from "@/components/fintera/hero-section";
import FeaturesSection from "@/components/fintera/features-section";
import PrequalificationSection from "@/components/fintera/prequalification-section";
import TrustSection from "@/components/fintera/trust-section";
import HowItWorksSection from "@/components/fintera/how-it-works-section";
import SocialProofSection from "@/components/fintera/social-proof-section";
import CTASection from "@/components/fintera/cta-section";
import Footer from "@/components/fintera/footer";

export const metadata: Metadata = {
  title: "Fintera | El Crédito que Necesitas Hoy - Colombia",
  description: "Créditos de vivienda, libre inversión y empresarial en Colombia. Proceso rápido, tasas preferenciales y aprobación garantizada. Precalíficate en 2 minutos.",
  keywords: ["credito colombia", "credito vivienda", "credito libre inversion", "credito empresarial", "prestamos bucaramanga", "financiamiento colombia"],
  authors: [{ name: "Fintera" }],
  openGraph: {
    title: "Fintera | El Crédito que Necesitas Hoy - Colombia",
    description: "Créditos rápidos y seguros en Colombia. Precalíficate ahora.",
    type: "website",
  },
};

export default function HomePage() {
  return (
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
      
      {/* Call to Action Section */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
