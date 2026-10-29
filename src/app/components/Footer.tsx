import { Instagram, Music2 } from "lucide-react";

const bookingUrl = "https://book.squareup.com/appointments/4xq8s10esmdcgp/location/LM3CKN1Y1RJ0P/services";

export default function Footer() {
  return (
    <footer className="border-t border-barber-gold/20 bg-barber-black text-barber-cream">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24 lg:px-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <p className="font-playfair text-3xl leading-tight">The Barber Shop</p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-barber-gold">Waterloo · London</p>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-barber-grey">A moment to slow down, a cut made for you. Find us just by the London Eye.</p>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block border-b border-barber-gold pb-1 text-sm font-semibold text-barber-gold hover:text-barber-cream">Book an appointment <span aria-hidden="true">↗</span></a>
          </div>
          <div>
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-barber-gold">Opening hours</h2>
            <dl className="space-y-3 text-sm text-barber-grey">
              <div><dt>Monday – Friday</dt><dd className="mt-1 text-barber-cream">9:30 – 19:00</dd></div>
              <div><dt>Saturday – Sunday</dt><dd className="mt-1 text-barber-cream">10:00 – 17:00</dd></div>
            </dl>
          </div>
          <div>
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-barber-gold">Visit & contact</h2>
            <address className="space-y-3 text-sm not-italic leading-relaxed text-barber-grey">
              <p>4 Milner Pl<br />London SE1 7PE</p>
              <p><a href="mailto:cut@waterloobarber.shop" className="hover:text-barber-cream">cut@waterloobarber.shop</a></p>
              <p><a href="https://maps.app.goo.gl/9ywRjxBrBzCKdguP6" target="_blank" rel="noopener noreferrer" className="text-barber-cream underline decoration-barber-gold underline-offset-4">Get directions <span aria-hidden="true">↗</span></a></p>
            </address>
          </div>
          <div>
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-barber-gold">Follow along</h2>
            <div className="flex gap-3">
              <a href="https://instagram.com/thebarbershop.london" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center border border-barber-gold/40 text-barber-cream hover:border-barber-gold hover:text-barber-gold"><Instagram size={20} aria-hidden="true" /></a>
              <a href="https://tiktok.com/@thebarbershop.london" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-11 w-11 items-center justify-center border border-barber-gold/40 text-barber-cream hover:border-barber-gold hover:text-barber-gold"><Music2 size={20} aria-hidden="true" /></a>
            </div>
            <p className="mt-4 text-sm text-barber-grey">@thebarbershop.london</p>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-2 border-t border-barber-gold/20 pt-6 text-xs text-barber-grey sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} The Barber Shop Waterloo.</p>
          <p>Sharp. Light. Elegant.</p>
        </div>
      </div>
    </footer>
  );
}
