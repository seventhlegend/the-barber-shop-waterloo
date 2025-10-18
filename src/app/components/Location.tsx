"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, ExternalLink, Train, Eye } from "lucide-react";

export default function Location() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const address = "123 York Road, Waterloo, London SE1";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <section
      id="location"
      ref={ref}
      className="relative py-24 md:py-32 bg-gradient-to-b from-barber-black to-barber-brown/30"
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
            Find Us in Waterloo
          </h2>
          <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
          <p className="text-lg md:text-xl font-inter text-barber-cream max-w-2xl mx-auto">
            Just steps from the London Eye and Waterloo Station.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Map Container - TODO: Add Google Maps Embed */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-barber-brown to-barber-black border-2 border-barber-gold/30 rounded-sm overflow-hidden group">
              {/* Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MapPin
                    className="w-16 h-16 text-barber-gold mx-auto"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-playfair text-barber-gold text-xl mb-2">
                      Interactive Map
                    </p>
                    <p className="font-inter text-barber-grey text-sm">
                      Google Maps embed will be added here
                    </p>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-barber-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Open in Maps Button */}
            <motion.a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-barber-gold text-barber-black font-inter font-semibold rounded-sm hover:bg-barber-cream transition-all duration-300 hover:shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Open in Google Maps
            </motion.a>
          </motion.div>

          {/* Right: Location Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Address */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin
                  className="w-6 h-6 text-barber-gold mt-1 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="text-2xl font-playfair text-barber-cream mb-2">
                    Address
                  </h3>
                  <p className="font-inter text-barber-grey leading-relaxed">
                    {address}
                  </p>
                </div>
              </div>
            </div>

            {/* Landmarks */}
            <div className="space-y-4">
              <h3 className="text-2xl font-playfair text-barber-cream mb-4">
                Nearby Landmarks
              </h3>

              {/* London Eye */}
              <div className="flex items-center gap-4 p-4 bg-barber-black/40 border border-barber-gold/20 rounded-sm">
                <Eye
                  className="w-8 h-8 text-barber-gold flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-inter text-barber-cream font-semibold">
                    London Eye
                  </p>
                  <p className="font-inter text-barber-grey text-sm">
                    2 minutes walk
                  </p>
                </div>
              </div>

              {/* Waterloo Station */}
              <div className="flex items-center gap-4 p-4 bg-barber-black/40 border border-barber-gold/20 rounded-sm">
                <Train
                  className="w-8 h-8 text-barber-gold flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="font-inter text-barber-cream font-semibold">
                    Waterloo Station
                  </p>
                  <p className="font-inter text-barber-grey text-sm">
                    5 minutes walk
                  </p>
                </div>
              </div>
            </div>

            {/* Transport Info */}
            <div className="p-6 bg-barber-gold/10 border border-barber-gold/30 rounded-sm">
              <h4 className="font-playfair text-barber-gold text-lg mb-3">
                Getting Here
              </h4>
              <ul className="space-y-2 font-inter text-barber-grey text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-barber-gold mt-1">•</span>
                  <span>
                    Tube: Waterloo (Northern, Bakerloo, Jubilee, Waterloo & City
                    lines)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-barber-gold mt-1">•</span>
                  <span>Bus: Multiple routes stop at Waterloo Station</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-barber-gold mt-1">•</span>
                  <span>Parking: Limited street parking available nearby</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
