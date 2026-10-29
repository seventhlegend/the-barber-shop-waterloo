"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const services = [
  { name: "Cut-Throat Razor Shave / Beard Reshape", price: "£28", category: "Beard & shave", description: "Traditional wet shave or beard redesign using hot towel and steamer." },
  { name: "Buzz Cut", price: "£36", category: "Hair", description: "Clipper-only haircut with hot towel, quick massage and professional blow-dry." },
  { name: "The Skin Fade", price: "£38", category: "Hair", description: "Seamless fade, finished with precision detailing and styling." },
  { name: "Scissor Precision Cut", price: "£38", category: "Hair", description: "A tailored consultation and scissor cut to complement your style." },
  { name: "Classic Haircut & Styling", price: "£36", category: "Hair", description: "Wash, cut, hot towel, mini massage and blow-dry." },
  { name: "Hair Clipper Cut", price: "£28", category: "Hair", description: "A clean, single-grade clipper cut." },
  { name: "Haircut & Beard Cut", price: "£55", category: "Hair & beard", description: "A haircut combined with a wet shave or detailed beard reshape." },
  { name: "Beard Trim – 'Gimgim Style'", price: "£33", category: "Beard & shave", description: "A sharp beard trim with a hot towel finish." },
  { name: "Neck Tidy & Finish", price: "£23", category: "Hair", description: "Hot towel, detailed neckline tidy-up and styled finish." },
  { name: "Waxing", price: "£16", category: "Treatments", description: "Precision facial or ear waxing." },
  { name: "Facial Mask", price: "£20", category: "Treatments", description: "A deep-cleansing and hydrating facial mask." },
  { name: "Total Relaxing", price: "£85", category: "Treatments", description: "Haircut, styling, shave, waxing and facial mask." },
  { name: "Grey Blending", price: "£36", category: "Treatments", description: "Subtle, natural colour blending to soften greys." },
] as const;

const categories = ["All", "Hair", "Beard & shave", "Treatments"] as const;
type Category = (typeof categories)[number];
const bookingUrl = "https://book.squareup.com/appointments/4xq8s10esmdcgp/location/LM3CKN1Y1RJ0P/services";

export default function Services() {
  const [category, setCategory] = useState<Category>("All");
  const visibleServices = category === "All" ? services : services.filter((service) => service.category === category || (service.category === "Hair & beard" && (category === "Hair" || category === "Beard & shave")));

  return (
    <section id="services" className="scroll-mt-24 bg-barber-black py-24 text-barber-cream md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2 className="max-w-[10ch] font-playfair text-5xl leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">Cuts, shaves<br /><span className="text-barber-gold">&amp; more.</span></h2>
          </div>
          <div className="flex flex-col justify-end md:col-span-5 md:col-start-8">
            <p className="max-w-md text-base leading-7 text-barber-grey md:text-lg">From a clean clipper cut to the full hot-towel treatment, find the service that feels right for you.</p>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 font-semibold text-barber-gold underline decoration-barber-gold/50 underline-offset-8 transition-colors hover:text-barber-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold">Book an appointment <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-2" aria-label="Filter services">
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-11 px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barber-gold ${category === item ? "bg-barber-gold text-barber-black" : "border border-barber-grey/50 text-barber-cream hover:border-barber-gold hover:text-barber-gold"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-7 border-t border-barber-cream/25" aria-live="polite">
          {visibleServices.map((service) => (
            <div key={service.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2 border-b border-barber-cream/20 py-6 sm:gap-x-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-baseline md:py-7">
              <h3 className="font-playfair text-xl leading-snug md:text-2xl">{service.name}</h3>
              <p className="col-span-2 text-base leading-6 text-barber-grey md:col-span-1 md:row-start-1 md:col-start-2">{service.description}</p>
              <p className="row-start-1 col-start-2 whitespace-nowrap font-playfair text-xl tabular-nums text-barber-gold md:col-start-3 md:text-2xl">{service.price}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-2 text-base leading-7 text-barber-grey sm:flex-row sm:gap-8">
          <p>Complimentary whisky, wine, coffee &amp; soft drinks.</p>
          <p>Students enjoy 20% off.</p>
        </div>
      </div>
    </section>
  );
}
