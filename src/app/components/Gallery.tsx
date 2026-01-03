"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Play, X } from "lucide-react";

// Gallery items
const galleryItems = [
  { type: "video", placeholder: "Interior Video", image: null },
  { type: "image", placeholder: "Interior", image: "/gallery-interior.webp" },
  { type: "image", placeholder: "Barber Chair", image: "/gallery-chair.webp" },
  { type: "image", placeholder: "Details", image: "/gallery-details.webp" },
  { type: "image", placeholder: "Products", image: "/gallery-products.webp" },
  {
    type: "image",
    placeholder: "Atmosphere",
    image: "/gallery-atmosphere.webp",
  },
];

export default function Gallery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <section
        id="gallery"
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
              Inside The Barber Shop
            </h2>
            <div className="w-24 h-px bg-barber-gold mx-auto mb-8"></div>
            <p className="text-lg md:text-xl font-inter text-barber-grey max-w-2xl mx-auto">
              Step into our world of refined grooming and timeless elegance.
            </p>
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {galleryItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className={`group relative overflow-hidden rounded-sm cursor-pointer ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
                onClick={() => item.image && setSelectedImage(item.image)}
              >
                {/* Image/Video Container */}
                <div
                  className={`relative bg-gradient-to-br from-barber-brown to-barber-black border border-barber-gold/30 overflow-hidden ${
                    index === 0 ? "aspect-video" : "aspect-square"
                  }`}
                >
                  {/* Image */}
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.placeholder}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-barber-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                    {item.type === "video" ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-barber-gold/20 border-2 border-barber-gold flex items-center justify-center">
                          <Play className="w-8 h-8 text-barber-gold fill-barber-gold" />
                        </div>
                        <p className="font-inter text-barber-cream text-sm">
                          Watch Video
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-barber-gold mx-auto mb-2 flex items-center justify-center">
                          <span className="text-barber-gold text-xl">+</span>
                        </div>
                        <p className="font-inter text-barber-cream text-sm">
                          View
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Placeholder Content for Video */}
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-barber-brown to-barber-black">
                      <div className="text-center space-y-3">
                        <Play className="w-12 h-12 text-barber-gold/50 mx-auto" />
                        <p className="font-playfair text-barber-gold/70 text-lg">
                          {item.placeholder}
                        </p>
                        <p className="font-inter text-barber-grey/50 text-xs uppercase tracking-wider">
                          Video Coming Soon
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Decorative Border Effect */}
                  <div className="absolute inset-0 border-2 border-barber-gold/0 group-hover:border-barber-gold/50 transition-all duration-300 pointer-events-none"></div>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-barber-gold/0 group-hover:border-barber-gold opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </motion.div>
            ))}
          </div>

          {/* Note for Video Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <p className="font-inter text-barber-grey/70 text-sm italic">
              🎥 Interior video coming soon
            </p>
          </motion.div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-barber-black/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-barber-gold hover:text-barber-cream transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" strokeWidth={2} />
          </button>
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            src={selectedImage}
            alt="Gallery view"
            className="max-w-full max-h-[90vh] object-contain border-2 border-barber-gold/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
