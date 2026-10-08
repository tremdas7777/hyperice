import { AnnouncementBar } from "./AnnouncementBar";
import { Audiences } from "./Audiences";
import { BannerCarousel } from "./BannerCarousel";
import { CartDrawer } from "./CartDrawer";
import { ColorShowcase } from "./ColorShowcase";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { MarqueeBand } from "./MarqueeBand";
import { ProductSection } from "./ProductSection";
import { StickyBuyBar } from "./StickyBuyBar";
import { TechStats } from "./TechStats";
import { Toast } from "./Toast";
import { ShopProvider } from "@/state/shop";

/** Loja de produto único: Nike Air Zoom Hyperslide. */
export function StorePage() {
  return (
    <ShopProvider>
      <div className="bg-paper font-sans text-ink antialiased">
        <AnnouncementBar />
        <Header />
        <main>
          <Hero />
          <MarqueeBand />
          <ProductSection />
          <BannerCarousel />
          <TechStats />
          <HowItWorks />
          <ColorShowcase />
          <Audiences />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
        <StickyBuyBar />
        <CartDrawer />
        <Toast />
      </div>
    </ShopProvider>
  );
}
