import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveStats from "@/components/LiveStats";
import Vision from "@/components/Vision";
import TeslaInventory from "@/components/TeslaInventory";
import InvestmentPlans from "@/components/InvestmentPlans";
import About from "@/components/About";
import Services from "@/components/Services";
import Leaderboard from "@/components/Leaderboard";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <LiveStats />
        <Vision />
        <TeslaInventory />
        <InvestmentPlans />
        <Leaderboard />
        <About />
        <Services />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
