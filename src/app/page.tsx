import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Experience from "./components/Experience";
import Gallery from "./components/Gallery";
import Location from "./components/Location";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="bg-barber-black">
      <Hero />
      <About />
      <Services />
      <Experience />
      <Gallery />
      <Location />
      <Footer />
    </main>
  );
}
