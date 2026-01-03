import Navbar from "./components/Navbar";
import WelcomePopup from "./components/WelcomePopup";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Experience from "./components/Experience";
import Gallery from "./components/Gallery";
import Location from "./components/Location";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MembershipWithPhoto from "./components/MembershipWithPhoto";

export default function Home() {
  return (
    <main className="bg-barber-black overflow-x-hidden">
      <WelcomePopup />
      <Navbar />
      <Hero />
      <Services />
      <MembershipWithPhoto />
      <Experience />
      <Gallery />
      <About />
      <Location />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
