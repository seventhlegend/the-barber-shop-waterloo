import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const bookingUrl = "https://book.squareup.com/appointments/4xq8s10esmdcgp/location/LM3CKN1Y1RJ0P/services";

export default function Hero() {
  return (
    <section className="bg-[#f5f2eb] pt-20 lg:bg-barber-black lg:pt-28" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-[1600px] lg:min-h-[690px] lg:grid-cols-[1fr_1fr]">
        <div className="order-2 flex flex-col justify-between px-6 pb-12 pt-10 sm:px-10 lg:order-1 lg:px-16 lg:py-16 xl:px-24">
          <div>
            <h1 id="hero-title" className="max-w-[11ch] text-[clamp(3.25rem,7vw,6rem)] leading-[0.98] tracking-[-0.035em] text-barber-black lg:text-barber-cream">
              The Barber Shop. <span className="italic text-[#806219] lg:text-barber-gold">Waterloo.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#504b42] lg:mt-8 lg:text-barber-grey">
              A good cut and a little time for yourself. Classic grooming and a moment to unwind, just moments from the London Eye.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 lg:mt-9">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center gap-4 bg-barber-gold px-6 font-semibold text-barber-black transition-colors hover:bg-[#e3c65c] lg:hover:bg-barber-cream">
                Book an appointment <ArrowUpRight aria-hidden="true" size={19} />
              </a>
              <a href="#services" className="inline-flex min-h-12 items-center gap-2 text-barber-black underline decoration-[#806219] underline-offset-8 hover:text-[#806219] lg:text-barber-cream lg:decoration-barber-gold lg:hover:text-barber-gold">
                Explore services <ArrowDownRight aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-black/20 pt-6 text-sm leading-relaxed text-[#504b42] lg:mt-14 lg:border-white/20 lg:text-barber-grey">
            <p><span className="block text-barber-black lg:text-barber-cream">Find us</span>4 Milner Place, SE1 7PE</p>
            <p><span className="block text-barber-black lg:text-barber-cream">Open daily</span>Appointments available online</p>
          </div>
        </div>
        <div className="order-1 relative self-start lg:order-2">
          <img src="/hero.webp" alt="The London Eye near The Barber Shop in Waterloo" width="1536" height="1024" className="block h-auto w-full lg:hidden" fetchPriority="high" />
          <img src="/gallery-chair.webp" alt="The interior of The Barber Shop in Waterloo" width="1280" height="1280" className="hidden h-auto w-full lg:block" fetchPriority="high" />
          <div className="absolute bottom-0 left-0 hidden bg-barber-gold px-8 py-4 text-sm font-semibold tracking-wide text-barber-black lg:block">The Barber Shop · Waterloo</div>
        </div>
      </div>
    </section>
  );
}
