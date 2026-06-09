import { useState } from "react";
import { CTASection } from "./components/CTASection";
import { DownloadSection } from "./components/DownloadSection";
import { FAQ } from "./components/FAQ";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { InstallSetup } from "./components/InstallSetup";
import { ProductShowcase } from "./components/ProductShowcase";
import { TechStack } from "./components/TechStack";
import { TrustBar } from "./components/TrustBar";
import { GitHubStarBanner } from "./components/GitHubStarBanner";

export default function App() {
  const [starBannerVisible, setStarBannerVisible] = useState(false);

  return (
    <div className={`min-h-screen${starBannerVisible ? " pb-16" : ""}`}>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <ProductShowcase />
        <InstallSetup />
        <TechStack />
        <Features />
        <DownloadSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <GitHubStarBanner onVisibleChange={setStarBannerVisible} />
    </div>
  );
}
