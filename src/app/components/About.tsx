export default function About() {
  return (
    <section id="about" className="bg-barber-cream px-6 py-20 text-barber-black sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <h2 className="max-w-md text-5xl leading-[1.05] tracking-[-0.025em] sm:text-6xl">Good grooming, right here in Waterloo.</h2>
        <div className="max-w-2xl lg:pt-2">
          <p className="text-xl leading-relaxed sm:text-2xl">The Barber Shop brings traditional craftsmanship and modern style together in a relaxed space near the London Eye.</p>
          <p className="mt-6 text-lg leading-relaxed text-[#514e48]">Whether you&apos;re stopping in for a regular cut or making time for the full experience, our aim is simple: attentive service and a look that feels right for you.</p>
          <a href="#location" className="mt-8 inline-flex min-h-12 items-center font-semibold underline decoration-[#8a6c19] underline-offset-8 hover:text-[#745a10]">Find the shop <span aria-hidden="true" className="ml-3">↗</span></a>
        </div>
      </div>
    </section>
  );
}
