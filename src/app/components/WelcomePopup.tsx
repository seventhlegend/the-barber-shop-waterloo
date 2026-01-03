"use client";

import { useState, useEffect } from "react";
import { X, Scissors, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WelcomePopup() {
  const [open, setOpen] = useState(true);

  // Prevent background scroll when popup is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-barber-black/95 backdrop-blur-lg px-4 py-8 md:py-12"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-barber-brown/30 via-barber-black to-barber-black border border-barber-gold shadow-2xl shadow-barber-gold/30 max-w-md w-full max-h-[85vh] overflow-hidden"
          >
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212, 175, 55, 0.1) 35px, rgba(212, 175, 55, 0.1) 70px)",
                }}
              ></div>
            </div>

            {/* Decorative Corner Accents with Animation */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-barber-gold"
            ></motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-barber-gold"
            ></motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-barber-gold"
            ></motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-barber-gold"
            ></motion.div>

            {/* Inner Corner Details */}
            <div className="absolute top-3 left-3 w-2 h-2 bg-barber-gold"></div>
            <div className="absolute top-3 right-3 w-2 h-2 bg-barber-gold"></div>
            <div className="absolute bottom-3 left-3 w-2 h-2 bg-barber-gold"></div>
            <div className="absolute bottom-3 right-3 w-2 h-2 bg-barber-gold"></div>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              whileHover={{ rotate: 90, scale: 1.1 }}
              className="absolute top-5 right-5 text-barber-gold hover:text-barber-cream transition-colors duration-300 z-10 p-1 hover:bg-barber-gold/10 rounded-full"
              onClick={() => setOpen(false)}
              aria-label="Close popup"
            >
              <X className="w-6 h-6" strokeWidth={2} />
            </motion.button>

            {/* Content */}
            <div className="relative flex flex-col items-center text-center px-5 md:px-6 py-5 md:py-6 space-y-2.5">
              {/* Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-1"
              >
                <p className="text-xs md:text-sm font-inter text-barber-grey uppercase tracking-[0.3em] font-light">
                  Welcome to
                </p>
                <h2 className="text-3xl md:text-4xl font-playfair text-barber-gold tracking-wide leading-tight">
                  The Barber Shop
                </h2>
              </motion.div>

              {/* Middle Divider */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "4rem" }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="h-px bg-gradient-to-r from-transparent via-barber-gold/50 to-transparent"
              ></motion.div>

              {/* Location Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full max-w-md overflow-hidden border-2 border-barber-gold/30"
              >
                <img
                  src="/location-preview.webp"
                  alt="The Barber Shop Location"
                  className="w-full h-48 md:h-36 object-cover"
                />
              </motion.div>

              {/* Premium Offer Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="relative px-5 py-2.5 bg-gradient-to-br from-barber-gold/15 to-barber-gold/5 border-2 border-barber-gold/50 w-full backdrop-blur-sm"
              >
                {/* Sparkle Icons */}
                <Sparkles className="absolute top-2 left-2 w-3 h-3 text-barber-gold/60" />
                <Sparkles className="absolute bottom-2 right-2 w-3 h-3 text-barber-gold/60" />

                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="text-lg md:text-xl font-playfair text-barber-gold font-bold mb-1 tracking-wide"
                >
                  25% OFF
                </motion.p>
                <p className="text-xs font-inter text-barber-cream leading-relaxed font-light">
                  Haircuts during our opening weeks
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(false)}
                className="relative px-8 py-2.5 bg-barber-gold text-barber-black font-inter font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10">Enter</span>
                <div className="absolute inset-0 bg-barber-cream scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
              </motion.button>

              {/* Bottom decorative text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-xs font-inter text-barber-grey/60 uppercase tracking-widest pt-0.5"
              >
                Waterloo · London
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
