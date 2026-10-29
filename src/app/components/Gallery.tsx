import { ArrowUpRight } from "lucide-react";

const gallery = [
  { image: "/gallery-interior.webp", description: "The shop sign", layout: "md:col-span-7" },
  { image: "/gallery-chair.webp", description: "Inside the shop", layout: "md:col-span-5 md:mt-24" },
  { image: "/gallery-details.webp", description: "The barber chair", layout: "md:col-span-4" },
  { image: "/gallery-atmosphere.webp", description: "A classic cut", layout: "md:col-span-5 md:mt-20" },
  { image: "/gallery-products.webp", description: "A fresh fade", layout: "md:col-span-3 md:mt-40" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="scroll-mt-24 bg-barber-black py-24 text-barber-cream md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-16">
        <div className="mb-12 flex flex-col justify-between gap-5 md:mb-20 md:flex-row md:items-end">
          <h2 className="max-w-[10ch] font-playfair text-5xl leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">A look inside.</h2>
          <p className="max-w-sm text-base leading-7 text-barber-grey md:text-lg">Take a moment, settle in and make yourself at home in Waterloo.</p>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-12 md:gap-x-7 md:gap-y-16">
          {gallery.map((item) => (
            <figure key={item.image} className={item.layout}>
              <a href={item.image} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.description.toLowerCase()} full size (opens in a new tab)`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold">
                <img src={item.image} alt={item.description} width={1280} height={1280} loading="lazy" className="block h-auto w-full transition-opacity duration-300 group-hover:opacity-90 motion-reduce:transition-none" />
              </a>
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-barber-grey">
                <span>{item.description}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-barber-gold" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
