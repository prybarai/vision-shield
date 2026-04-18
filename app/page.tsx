import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import UploadStage from "@/components/UploadStage";
import HowItWorks from "@/components/HowItWorks";
import Showcase from "@/components/Showcase";
import TrustBand from "@/components/TrustBand";

export default function HomePage() {
 return (
 <main className="relative z-10 bg-canvas">
 <Nav />
 <Hero />
 <TrustBand />
 <UploadStage />
 <HowItWorks />
 <Showcase />
 <Footer />
 </main>
 );
}
