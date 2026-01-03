"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Crown, Star, Sparkles } from "lucide-react";

const memberships = [
  {
    icon: Sparkles,
    name: "Classic Membership",
    price: "Free",
    highlight: false,
    benefits: [
      "Birthday week 40% off any service",
      "1 free annual hair & scalp analysis",
      "1 free annual facial mask",
    ],
  },
  {
    icon: Star,
    name: "Premium Pro Membership",
    price: "£150 one time",
    highlight: true,
    benefits: [
      "Custom name-printed barber bag",
      "After-hours appointments (up to 8PM)",
      "10% off on products",
      "Plus classic membership benefits",
    ],
  },
  {
    icon: Crown,
    name: "Executive VIP Membership",
    price: "£150/month",
    highlight: false,
    benefits: [
      "Weekly haircut or beard service",
      "Exclusive after-hours appointments (up to 9PM)",
      "20% discount on all products",
      "Plus classic membership benefits",
    ],
  },
];

export default function MembershipWithPhoto() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="membership"
      ref={ref}
      className="relative py-24 md:py-32 bg-barber-black overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 opacity-15">
        <img
          src="/hero.webp"
          alt="Membership Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-barber-black via-barber-black/80 to-barber-black"></div>
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
            Membership
          </h2>
          <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
          <p className="text-lg md:text-xl font-inter text-barber-cream max-w-3xl mx-auto leading-relaxed">
            Join our exclusive membership programme and enjoy premium benefits
            tailored to your grooming needs.
          </p>
        </motion.div>

        {/* Membership Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {memberships.map((membership, index) => {
            const Icon = membership.icon;
            return (
              <motion.div
                key={membership.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className={`relative group ${
                  membership.highlight ? "md:-mt-4 md:mb-4" : ""
                }`}
              >
                {/* Card */}
                <div
                  className={`relative h-full bg-barber-brown/20 backdrop-blur-sm border-2 ${
                    membership.highlight
                      ? "border-barber-gold shadow-lg shadow-barber-gold/20"
                      : "border-barber-gold/30 hover:border-barber-gold/60"
                  } p-8 transition-all duration-300 hover:transform hover:scale-105`}
                >
                  {membership.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-barber-gold text-barber-black px-4 py-1 text-sm font-inter font-semibold">
                      MOST POPULAR
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative inline-flex items-center justify-center w-16 h-16">
                      <div
                        className={`absolute inset-0 border-2 ${
                          membership.highlight
                            ? "border-barber-gold"
                            : "border-barber-gold/50"
                        } rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500`}
                      ></div>
                      <Icon
                        className={`w-8 h-8 ${
                          membership.highlight
                            ? "text-barber-gold"
                            : "text-barber-gold/70"
                        } relative z-10`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-playfair text-barber-cream mb-3">
                      {membership.name}
                    </h3>
                    <p
                      className={`text-3xl font-inter font-bold ${
                        membership.highlight
                          ? "text-barber-gold"
                          : "text-barber-gold/80"
                      }`}
                    >
                      {membership.price}
                    </p>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-4 mb-8">
                    {membership.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-barber-grey font-inter"
                      >
                        <Check className="w-5 h-5 text-barber-gold flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <a
                    href="https://book.squareup.com/appointments/4xq8s10esmdcgp/location/LM3CKN1Y1RJ0P/services"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center py-3 px-6 font-inter font-semibold transition-all duration-300 ${
                      membership.highlight
                        ? "bg-barber-gold text-barber-black hover:bg-barber-cream"
                        : "border-2 border-barber-gold text-barber-gold hover:bg-barber-gold hover:text-barber-black"
                    }`}
                  >
                    Join Now
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
