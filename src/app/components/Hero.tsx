"use client";

import { motion } from "framer-motion";
import { ArrowRight, Scissors } from "lucide-react";

export default function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-barber-black">
      {/* Background: London Eye Silhouette (placeholder - gerçek görsel eklenecek) */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-barber-gold/20 via-transparent to-barber-black"></div>
        {/* TODO: London Eye siluet görseli eklenecek */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-4 border-barber-gold/20 rounded-full"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Logo Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <Scissors
              className="w-16 h-16 text-barber-gold"
              strokeWidth={1.5}
            />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl md:text-7xl lg:text-8xl font-playfair text-barber-gold tracking-wider"
          >
            THE BARBER SHOP
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-2"
          >
            <p className="text-2xl md:text-3xl font-playfair text-barber-cream italic">
              Sharp. Light. Elegant.
            </p>
            <div className="w-24 h-px bg-barber-gold mx-auto"></div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-lg md:text-xl font-inter text-barber-grey max-w-2xl mx-auto"
          >
            Experience refined grooming in the heart of London.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            {/* Primary CTA */}
            <a
              href="mailto:cut@waterloobarber.shop"
              className="group relative px-8 py-4 bg-barber-gold text-barber-black font-inter font-semibold text-lg rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-barber-gold/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Book an Appointment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-barber-cream scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
            </a>

            {/* Secondary CTA */}
            <button
              onClick={() => scrollToSection("services")}
              className="group px-8 py-4 border-2 border-barber-gold text-barber-gold font-inter font-semibold text-lg rounded-sm hover:bg-barber-gold hover:text-barber-black transition-all duration-300"
            >
              Explore Services
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-barber-gold rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-barber-gold rounded-full"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}
