"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Scissors, Wind, Sparkles, Coffee } from "lucide-react";

const services = [
  {
    icon: Scissors,
    name: "Buzz Cut",
    price: "£36",
    description:
      "Clipper-only haircut with hot towel, quick massage & professional blow-dry. Clean, simple, timeless.",
  },
  {
    icon: Wind,
    name: "The Skin Fade",
    price: "£38",
    description:
      "Seamless fade from light to dark, finished with precision detailing and refined styling.",
  },
  {
    icon: Scissors,
    name: "Scissor Precision Cut",
    price: "£38",
    description:
      "Tailored consultation and scissor cut, crafted to complement your features and style.",
  },
  {
    icon: Sparkles,
    name: "Classic Haircut & Styling",
    price: "£36",
    description:
      "Wash, cut, hot towel, mini massage & blow-dry — a complete refresh.",
  },
  {
    icon: Scissors,
    name: "Hair Clipper Cut",
    price: "£28",
    description: "Single-grade clipper cut. Minimalist, sharp, and effortless.",
  },
  {
    icon: Sparkles,
    name: "Cut-Throat Razor Shave / Beard Reshape",
    price: "£28",
    description:
      "Traditional wet shave or beard redesign using hot towel & steamer — the classic ritual, redefined.",
  },
  {
    icon: Scissors,
    name: "Haircut & Beard Cut",
    price: "£55",
    description:
      "Haircut combined with a wet shave or detailed beard reshape. The perfect balance.",
  },
  {
    icon: Scissors,
    name: "Beard Trim – 'Gimgim Style'",
    price: "£33",
    description:
      "Signature sharp beard trim with hot towel finish — meticulous and modern.",
  },
  {
    icon: Sparkles,
    name: "Neck Tidy & Finish",
    price: "£23",
    description:
      "Hot towel, detailed neckline tidy-up & styled finish for that fresh-cut feeling.",
  },
  {
    icon: Sparkles,
    name: "Waxing",
    price: "£16",
    description: "Precision facial or ear waxing for a clean, polished look.",
  },
  {
    icon: Sparkles,
    name: "Facial Mask",
    price: "£20",
    description:
      "Deep-cleansing and hydrating facial mask to restore and refresh.",
  },
  {
    icon: Sparkles,
    name: "Total Relaxing",
    price: "£70",
    description:
      "Full package: haircut, styling, shave, waxing & facial mask. The complete rejuvenation experience.",
  },
  {
    icon: Sparkles,
    name: "Grey Blending",
    price: "£36",
    description:
      "Subtle, natural colour blending to refine and soften greys — sophisticated and discreet.",
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="services"
      ref={ref}
      className="relative py-24 md:py-32 bg-barber-black"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-playfair text-barber-gold mb-6">
            Our Services
          </h2>
          <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
          <p className="text-lg md:text-xl font-inter text-barber-grey max-w-2xl mx-auto">
            Premium grooming, designed for the modern gentleman.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-[1600px] mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                className="group relative bg-barber-brown/20 border border-barber-gold/20 rounded-sm p-4 md:p-6 hover:border-barber-gold hover:bg-barber-brown/30 transition-all duration-300 cursor-default"
              >
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-barber-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon & Price - Horizontal on Mobile */}
                  <div className="flex items-start justify-between mb-3">
                    <Icon
                      className="w-6 h-6 md:w-8 md:h-8 text-barber-gold group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                      strokeWidth={1.5}
                    />
                    <p className="text-2xl md:text-3xl font-playfair text-barber-gold">
                      {service.price}
                    </p>
                  </div>

                  {/* Service Name */}
                  <h3 className="text-lg md:text-xl lg:text-2xl font-playfair text-barber-cream mb-2 leading-tight">
                    {service.name}
                  </h3>

                  {/* Description - Shorter on mobile */}
                  <p className="font-inter text-barber-grey text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                    {service.description}
                  </p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 border-t-2 border-r-2 border-barber-gold/0 group-hover:border-barber-gold/50 transition-all duration-300 rounded-tr-sm"></div>
              </motion.div>
            );
          })}
        </div>

        {/* Complimentary Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 md:mt-16 space-y-4"
        >
          {/* Complimentary Drinks */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-6 py-3 bg-barber-gold/10 border border-barber-gold/30 rounded-sm">
              <Coffee
                className="w-5 h-5 text-barber-gold flex-shrink-0"
                strokeWidth={1.5}
              />
              <p className="font-inter text-barber-cream text-sm md:text-base text-center">
                Complimentary:{" "}
                <span className="text-barber-gold font-semibold">
                  Whisky, wine, coffee & soft drinks
                </span>
              </p>
            </div>
          </div>

          {/* Student Discount */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-6 py-3 bg-barber-cream/5 border border-barber-cream/20 rounded-sm">
              <Sparkles
                className="w-5 h-5 text-barber-cream flex-shrink-0"
                strokeWidth={1.5}
              />
              <p className="font-inter text-barber-cream text-sm md:text-base text-center">
                Student Discount:{" "}
                <span className="text-barber-gold font-semibold">20% off</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-8 md:mt-12"
        >
          <a
            href="https://book.squareup.com/appointments/4xq8s10esmdcgp/location/LM3CKN1Y1RJ0P/services"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 md:px-10 py-3 md:py-4 bg-barber-gold text-barber-black font-inter font-semibold text-base md:text-lg rounded-sm hover:bg-barber-cream transition-all duration-300 hover:shadow-lg hover:shadow-barber-gold/50"
          >
            Book Your Appointment
          </a>
        </motion.div>
      </div>
    </section>
  );
}
