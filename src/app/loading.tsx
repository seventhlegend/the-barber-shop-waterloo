"use client";

import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-barber-black z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Animated Scissors Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Scissors
              className="w-16 h-16 text-barber-gold"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-playfair text-barber-gold">
            THE BARBER SHOP
          </h2>
          <p className="font-inter text-barber-grey text-sm">
            Loading your experience...
          </p>
        </motion.div>

        {/* Loading Bar */}
        <motion.div className="w-48 h-1 bg-barber-brown/30 rounded-full overflow-hidden mx-auto">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/3 bg-barber-gold rounded-full"
          ></motion.div>
        </motion.div>
      </div>
    </div>
  );
}
