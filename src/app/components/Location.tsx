import { ArrowUpRight } from "lucide-react";

const mapUrl = "https://maps.app.goo.gl/9ywRjxBrBzCKdguP6";

export default function Location() {
  return (
    <section id="location" className="bg-barber-black px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 className="font-playfair text-5xl leading-tight text-barber-cream md:text-6xl">Find us in Waterloo</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-barber-grey">
              Near the London Eye and Waterloo Station. Come in, take a seat and make some time for yourself.
            </p>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold text-barber-gold">Address</h3>
                <address className="mt-3 not-italic leading-relaxed text-barber-cream">
                  4 Milner Pl<br />London SE1 7PE
                </address>
              </div>
              <div>
                <h3 className="text-base font-semibold text-barber-gold">Opening hours</h3>
                <dl className="mt-3 space-y-2 text-barber-cream">
                  <div><dt>Monday – Friday</dt><dd className="text-barber-grey">9:30 – 19:00</dd></div>
                  <div><dt>Saturday – Sunday</dt><dd className="text-barber-grey">10:00 – 17:00</dd></div>
                </dl>
              </div>
            </div>

            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-9 inline-flex min-h-12 items-center gap-2 bg-barber-gold px-6 font-semibold text-barber-black transition-colors hover:bg-barber-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-barber-gold">
              Get directions <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>

          <div className="relative min-h-[340px] overflow-hidden bg-[#292621] lg:min-h-[530px]">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.11838734149932863%2C51.502386632355716%2C-0.11549055576324464%2C51.50387090652489&amp;layer=mapnik&amp;marker=51.50312794068353%2C-0.11693894863128662"
              title="Map showing The Barber Shop at 4 Milner Place, London"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
