import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Experience from "./components/Experience";
import Gallery from "./components/Gallery";
import Location from "./components/Location";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

export default function Home() {
  return (
    <main className="bg-barber-black overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Experience />
      <Gallery />
      <Location />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
