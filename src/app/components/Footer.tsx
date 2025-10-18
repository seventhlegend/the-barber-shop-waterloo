"use client";

import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Instagram, Music2, Scissors } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-barber-black border-t border-barber-gold/20">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Scissors
                className="w-10 h-10 text-barber-gold"
                strokeWidth={1.5}
              />
              <h3 className="text-2xl font-playfair text-barber-gold">
                THE BARBER SHOP
              </h3>
              <p className="font-playfair text-barber-grey italic text-sm">
                Sharp. Light. Refined.
              </p>
            </div>
            <p className="font-inter text-barber-grey text-sm leading-relaxed">
              Premium grooming experience in the heart of London, where
              tradition meets modern elegance.
            </p>
          </motion.div>

          {/* Opening Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-barber-gold" strokeWidth={1.5} />
              <h4 className="font-playfair text-barber-cream text-lg">
                Opening Hours
              </h4>
            </div>
            <div className="space-y-2 font-inter text-sm">
              <div className="flex justify-between">
                <span className="text-barber-grey">Monday – Friday</span>
                <span className="text-barber-cream">9:30 – 19:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-barber-grey">Saturday – Sunday</span>
                <span className="text-barber-cream">10:00 – 17:00</span>
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="font-playfair text-barber-cream text-lg mb-4">
              Contact
            </h4>
            <div className="space-y-3 font-inter text-sm">
              <a
                href="mailto:cut@waterloobarber.shop"
                className="flex items-start gap-3 text-barber-grey hover:text-barber-gold transition-colors group"
              >
                <Mail
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <span className="group-hover:underline">
                  cut@waterloobarber.shop
                </span>
              </a>
              <div className="flex items-start gap-3 text-barber-grey">
                <MapPin
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <span>123 York Road, Waterloo, London SE1</span>
              </div>
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h4 className="font-playfair text-barber-cream text-lg mb-4">
              Follow Us
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/thebarbershop.waterloo"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 border-2 border-barber-gold/30 rounded-sm flex items-center justify-center hover:border-barber-gold hover:bg-barber-gold/10 transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram
                  className="w-6 h-6 text-barber-gold group-hover:scale-110 transition-transform"
                  strokeWidth={1.5}
                />
              </a>
              <a
                href="https://tiktok.com/@thebarbershop.waterloo"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 border-2 border-barber-gold/30 rounded-sm flex items-center justify-center hover:border-barber-gold hover:bg-barber-gold/10 transition-all duration-300"
                aria-label="TikTok"
              >
                <Music2
                  className="w-6 h-6 text-barber-gold group-hover:scale-110 transition-transform"
                  strokeWidth={1.5}
                />
              </a>
            </div>
            <p className="font-inter text-barber-grey text-sm">
              @thebarbershop.waterloo
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-barber-gold/20 text-center"
        >
          <a
            href="mailto:cut@waterloobarber.shop"
            className="inline-block px-10 py-4 bg-barber-gold text-barber-black font-inter font-semibold text-lg rounded-sm hover:bg-barber-cream transition-all duration-300 hover:shadow-lg hover:shadow-barber-gold/30"
          >
            Book Your Appointment Today
          </a>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-barber-gold/20 bg-barber-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-inter text-barber-grey">
            <p>© {currentYear} The Barber Shop – Designed in London.</p>
            <p className="text-barber-gold/70">Sharp. Light. Elegant.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
