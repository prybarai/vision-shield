import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import UploadStage from "@/components/UploadStage";
import Showcase from "@/components/Showcase";
import TrustBand from "@/components/TrustBand";
import AddictiveFlow from "@/components/AddictiveFlow";

export default function HomePage() {
 return (
 <main className="relative z-10 bg-canvas">
 <Nav />
 <Hero />
 <TrustBand />
 <UploadStage />
 <AddictiveFlow />
 <Showcase />
 <Footer />
 </main>
 );
}
