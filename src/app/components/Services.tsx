"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BOOKING_PATH } from "../../lib/booking-routes";
import { DAYTIME_CATEGORY_ID } from "../../lib/booking-policy.mjs";

type Service = { id: string; categoryId: string; name: string; description: string; price: number; currency: string; priceDescription: string };
type Catalog = { categories: { id: string; name: string }[]; services: Service[] };
const money = (service: Service) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: service.currency }).format(service.price / 100);

export default function Services() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [categoryId, setCategoryId] = useState(DAYTIME_CATEGORY_ID);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/api/booking/config', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Services unavailable');
      const data = await response.json() as Catalog;
      setCatalog(data);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  const visibleServices = catalog?.services.filter(service => service.categoryId === categoryId) || [];

  return (
    <section id="services" className="scroll-mt-24 bg-barber-black py-24 text-barber-cream md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-16">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2 className="max-w-[10ch] font-playfair text-5xl leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">Cuts, shaves<br /><span className="text-barber-gold">&amp; more.</span></h2>
          </div>
          <div className="flex flex-col justify-end md:col-span-5 md:col-start-8">
            <p className="max-w-md text-base leading-7 text-barber-grey md:text-lg">From a clean clipper cut to the full hot-towel treatment, find the service that feels right for you.</p>
            <a href={BOOKING_PATH} className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 font-semibold text-barber-gold underline decoration-barber-gold/50 underline-offset-8 transition-colors hover:text-barber-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold">Book an appointment <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
          </div>
        </div>

        {catalog && <div className="mt-16 flex flex-wrap gap-2" role="group" aria-label="Filter services">
          {catalog.categories.map(category => (
            <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)} className={`min-h-11 px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-barber-gold ${categoryId === category.id ? "bg-barber-gold text-barber-black" : "border border-barber-grey/50 text-barber-cream hover:border-barber-gold hover:text-barber-gold"}`}>
              {category.name}
            </button>
          ))}
        </div>}

        <div className="mt-7 border-t border-barber-cream/25" aria-live="polite" aria-busy={!catalog && !error}>
          {error ? <div className="py-8 text-barber-grey" role="alert">
            <p>Services could not be loaded. Please try again.</p>
            <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 min-h-11 text-barber-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold">Try again</button>
          </div> : !catalog ? <p className="py-8 text-barber-grey" role="status">Loading services…</p> : !visibleServices.length ? <p className="py-8 text-barber-grey">No services are currently available in this category.</p> : visibleServices.map(service => (
            <div key={service.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2 border-b border-barber-cream/20 py-6 sm:gap-x-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-baseline md:py-7">
              <h3 className="font-playfair text-xl leading-snug md:text-2xl">{service.name}</h3>
              <div className="col-span-2 text-base leading-6 text-barber-grey md:col-span-1 md:row-start-1 md:col-start-2">
                {service.description && <p className="whitespace-pre-line">{service.description}</p>}
                {service.priceDescription && <p className="mt-2 whitespace-pre-line text-sm text-barber-gold">{service.priceDescription}</p>}
              </div>
              <p className="row-start-1 col-start-2 whitespace-nowrap font-playfair text-xl tabular-nums text-barber-gold md:col-start-3 md:text-2xl">{money(service)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
