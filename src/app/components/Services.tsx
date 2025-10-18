"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Scissors, Wind, Sparkles, Coffee } from "lucide-react";

const services = [
  {
    icon: Scissors,
    name: "Classic Haircut",
    price: "£36",
    description: "Timeless styling with modern precision",
  },
  {
    icon: Wind,
    name: "The Skin Fade",
    price: "£38",
    description: "Sharp, clean fade tailored to perfection",
  },
  {
    icon: Scissors,
    name: "Scissor Precision Cut",
    price: "£38",
    description: "Expert scissor work for refined results",
  },
  {
    icon: Sparkles,
    name: "Traditional Hot Towel Shave",
    price: "£28",
    description: "Classic shave with premium products",
  },
  {
    icon: Scissors,
    name: "Beard Trim 'Gimgim Style'",
    price: "£28",
    description: "Signature beard sculpting and grooming",
  },
  {
    icon: Sparkles,
    name: "Total Relaxing",
    price: "£70",
    description: "Complete grooming experience & wellness",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="group relative bg-barber-brown/20 border border-barber-gold/20 rounded-sm p-8 hover:border-barber-gold hover:bg-barber-brown/30 transition-all duration-300 cursor-default"
              >
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-barber-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-4">
                    <Icon
                      className="w-8 h-8 text-barber-gold group-hover:scale-110 transition-transform duration-300"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Service Name */}
                  <h3 className="text-2xl font-playfair text-barber-cream mb-2">
                    {service.name}
                  </h3>

                  {/* Price */}
                  <p className="text-3xl font-playfair text-barber-gold mb-3">
                    {service.price}
                  </p>

                  {/* Description */}
                  <p className="font-inter text-barber-grey text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-barber-gold/0 group-hover:border-barber-gold/50 transition-all duration-300 rounded-tr-sm"></div>
              </motion.div>
            );
          })}
        </div>

        {/* Complimentary Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-barber-gold/10 border border-barber-gold/30 rounded-sm">
            <Coffee className="w-6 h-6 text-barber-gold" strokeWidth={1.5} />
            <p className="font-inter text-barber-cream">
              All services include complimentary drinks —{" "}
              <span className="text-barber-gold font-semibold">
                coffee, wine or whisky
              </span>
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-12"
        >
          <a
            href="mailto:cut@waterloobarber.shop"
            className="inline-block px-10 py-4 bg-barber-gold text-barber-black font-inter font-semibold text-lg rounded-sm hover:bg-barber-cream transition-all duration-300 hover:shadow-lg hover:shadow-barber-gold/50"
          >
            Book Your Appointment
          </a>
        </motion.div>
      </div>
    </section>
  );
}
