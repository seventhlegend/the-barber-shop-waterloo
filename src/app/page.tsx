export default function Home() {
  return (
    <div className="min-h-screen bg-barber-black text-barber-cream">
      {/* Test Section - Phase 1 Complete */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          {/* Title with Playfair Display */}
          <h1 className="text-6xl md:text-8xl font-playfair text-barber-gold">
            THE BARBER SHOP
          </h1>

          {/* Subtitle with Inter */}
          <p className="text-xl md:text-2xl font-inter text-barber-grey">
            Sharp. Light. Elegant.
          </p>

          {/* Description */}
          <p className="text-lg font-inter max-w-2xl mx-auto">
            Experience refined grooming in the heart of London.
          </p>

          {/* Color Palette Test */}
          <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto mt-12">
            <div className="space-y-2">
              <div className="h-20 bg-barber-black border border-barber-gold rounded"></div>
              <p className="text-xs">Black</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-barber-gold rounded"></div>
              <p className="text-xs">Gold</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-barber-cream rounded"></div>
              <p className="text-xs text-barber-black">Cream</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-barber-grey rounded"></div>
              <p className="text-xs">Grey</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-barber-brown rounded"></div>
              <p className="text-xs">Brown</p>
            </div>
          </div>

          {/* Font Test */}
          <div className="mt-12 space-y-4 text-left max-w-2xl mx-auto">
            <h2 className="text-3xl font-playfair text-barber-gold">
              Phase 1: Setup ✓ Complete
            </h2>
            <ul className="space-y-2 font-inter text-barber-grey">
              <li>✓ Next.js 15 with App Router</li>
              <li>✓ TailwindCSS configured</li>
              <li>✓ Playfair Display (headings)</li>
              <li>✓ Inter (body text)</li>
              <li>✓ Custom color palette</li>
              <li>✓ Framer Motion installed</li>
              <li>✓ lucide-react & clsx installed</li>
            </ul>
          </div>

          {/* Button Test */}
          <div className="flex gap-4 justify-center mt-12">
            <button className="px-8 py-3 bg-barber-gold text-barber-black font-inter font-semibold rounded hover:bg-opacity-90 transition-all">
              Primary CTA
            </button>
            <button className="px-8 py-3 border-2 border-barber-gold text-barber-gold font-inter font-semibold rounded hover:bg-barber-gold hover:text-barber-black transition-all">
              Secondary CTA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
