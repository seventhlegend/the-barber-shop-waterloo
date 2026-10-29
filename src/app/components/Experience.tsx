export default function Experience() {
  return (
    <section id="experience" className="bg-[#28241f] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <img src="/gallery-details.webp" alt="The barber chair inside The Barber Shop" width="1280" height="1280" loading="lazy" className="block h-auto w-full" />
        </div>
        <div className="max-w-xl">
          <h2 className="text-5xl leading-[1.05] tracking-[-0.025em] text-barber-cream sm:text-6xl">Make yourself <span className="italic text-barber-gold">at home.</span></h2>
          <p className="mt-7 text-lg leading-relaxed text-barber-grey">A visit should feel like time well spent. Settle in, enjoy a complimentary drink and let us take care of the details.</p>
          <div className="mt-10 grid gap-7 border-t border-white/20 pt-7 sm:grid-cols-2">
            <div><h3 className="text-2xl text-barber-cream">Something to sip</h3><p className="mt-3 leading-relaxed text-barber-grey">From coffee to whisky, enjoy a drink while you unwind.</p></div>
            <div><h3 className="text-2xl text-barber-cream">The finishing touch</h3><p className="mt-3 leading-relaxed text-barber-grey">Traditional hot towels bring a little extra calm to your visit.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
