"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Scissors, Sparkles, Award } from "lucide-react";

const values = [
  {
    icon: Scissors,
    title: "Craftsmanship",
    description:
      "Traditional techniques perfected over decades, delivered with precision and care.",
  },
  {
    icon: Sparkles,
    title: "Calm Atmosphere",
    description:
      "A refined space designed for relaxation, away from the noise of everyday life.",
  },
  {
    icon: Award,
    title: "Refined Style",
    description:
      "Modern elegance meets timeless grooming in every cut and service.",
  },
];

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="about"
      ref={ref}
      className="relative py-24 md:py-32 bg-barber-brown/30 overflow-hidden"
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-barber-black via-transparent to-barber-black opacity-50"></div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-playfair text-barber-gold mb-6">
            About Us
          </h2>
          <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
          <p className="text-lg md:text-xl font-inter text-barber-cream max-w-3xl mx-auto leading-relaxed">
            Located near the iconic London Eye, The Barber Shop blends
            traditional craftsmanship with modern elegance.
          </p>
          <p className="text-lg md:text-xl font-inter text-barber-grey max-w-3xl mx-auto mt-4">
            Our mission: redefine men&apos;s grooming — refined, calm, and
            sophisticated.
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-16">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="group text-center"
              >
                {/* Icon Container */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 mx-auto">
                  <div className="absolute inset-0 border-2 border-barber-gold rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
                  <Icon
                    className="w-10 h-10 text-barber-gold relative z-10"
                    strokeWidth={1.5}
                  />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-playfair text-barber-cream mb-3">
                  {value.title}
                </h3>

                {/* Description */}
                <p className="font-inter text-barber-grey leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Accent */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-barber-gold to-transparent mx-auto mt-16"
        ></motion.div>
      </div>
    </section>
  );
}
