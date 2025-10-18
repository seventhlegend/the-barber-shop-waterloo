"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Coffee, Wine, Droplets } from "lucide-react";

const experiences = [
  {
    icon: Coffee,
    title: "Artisan Coffee",
    description: "Freshly brewed premium coffee to start your experience",
  },
  {
    icon: Wine,
    title: "Fine Whisky",
    description: "Select spirits from our curated collection",
  },
  {
    icon: Droplets,
    title: "Hot Towel",
    description: "Traditional relaxation in every service",
  },
];

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="experience"
      ref={ref}
      className="relative py-24 md:py-32 bg-gradient-to-b from-barber-brown/40 to-barber-black overflow-hidden"
    >
      {/* Bokeh Background Effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-barber-gold/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-barber-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-barber-brown/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-playfair text-barber-gold mb-6">
            The Experience
          </h2>
          <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl font-playfair text-barber-cream max-w-3xl mx-auto leading-relaxed italic">
            Enjoy complimentary drinks — from artisan coffee to fine whisky —
            while you unwind.
          </p>
          <p className="text-lg font-inter text-barber-grey max-w-2xl mx-auto mt-6">
            More than a haircut. A ritual.
          </p>
        </motion.div>

        {/* Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {experiences.map((exp, index) => {
            const Icon = exp.icon;
            return (
              <motion.div
                key={exp.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                className="group relative"
              >
                {/* Card */}
                <div className="relative bg-barber-black/60 backdrop-blur-sm border border-barber-gold/30 rounded-sm p-8 hover:border-barber-gold hover:bg-barber-black/80 transition-all duration-300">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-barber-gold/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <Icon
                        className="relative w-16 h-16 text-barber-gold group-hover:scale-110 transition-transform duration-300"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-playfair text-barber-cream text-center mb-3">
                    {exp.title}
                  </h3>

                  {/* Description */}
                  <p className="font-inter text-barber-grey text-center text-sm leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <blockquote className="relative max-w-3xl mx-auto">
            <div className="text-6xl text-barber-gold/30 font-playfair absolute -top-6 -left-4">
              "
            </div>
            <p className="text-2xl md:text-3xl font-playfair text-barber-cream italic leading-relaxed">
              A space where tradition meets modern elegance, and every visit
              feels like a retreat.
            </p>
            <div className="text-6xl text-barber-gold/30 font-playfair absolute -bottom-12 -right-4">
              "
            </div>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
