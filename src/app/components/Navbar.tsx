"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BOOKING_PATH } from "../../lib/booking-routes";
import BrandLogo from './BrandLogo';

const links = [
  { label: "Services", href: "#services" },
  { label: "Membership", href: "#membership" },
  { label: "The experience", href: "#experience" },
  { label: "Gallery", href: "#gallery" },
  { label: "Find us", href: "#location" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-barber-cream/10 bg-barber-black">
      <nav aria-label="Main navigation" className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-6 px-5 md:px-10 lg:px-12">
        <a href="#top" onClick={() => setOpen(false)} className="shrink-0 text-barber-cream" aria-label="The Barber Shop, home">
          <BrandLogo />
        </a>
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-barber-cream/85 transition-colors hover:text-barber-gold">{link.label}</a>
          ))}
          <a href={BOOKING_PATH} className="border border-barber-gold bg-barber-gold px-5 py-3 text-sm font-semibold text-barber-black transition-colors hover:bg-barber-cream hover:border-barber-cream">Book an appointment <span aria-hidden="true">↗</span></a>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"} className="flex h-11 w-11 items-center justify-center text-barber-cream lg:hidden">
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>
      <div id="mobile-navigation" hidden={!open} className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-barber-gold/20 bg-barber-black px-5 pb-7 pt-3 lg:hidden">
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-barber-gold/15 py-4 font-playfair text-xl text-barber-cream">{link.label}</a>
        ))}
        <a href={BOOKING_PATH} onClick={() => setOpen(false)} className="mt-6 block bg-barber-gold px-5 py-4 text-center font-semibold text-barber-black">Book an appointment <span aria-hidden="true">↗</span></a>
      </div>
    </header>
  );
}
