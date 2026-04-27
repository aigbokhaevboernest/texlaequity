import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveStats from "@/components/LiveStats";
import TeslaShowcase from "@/components/TeslaShowcase";
import InvestmentPlans from "@/components/InvestmentPlans";
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
        <TeslaShowcase />
        <InvestmentPlans />
        <Leaderboard />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
