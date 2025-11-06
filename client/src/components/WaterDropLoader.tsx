"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const WaterDropLoader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash effect after drop falls
    const splashTimer = setTimeout(() => {
      setShowSplash(true);
    }, 1000);

    // Hide loader after animation completes
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Create scatter particles
  const scatterParticles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center overflow-hidden"
        >
          {/* Background animated circles */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-20 left-20 w-64 h-64 bg-green-100 rounded-full opacity-10"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-48 h-48 bg-blue-100 rounded-full opacity-10"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -40, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Main content container */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Single large water drop */}
            <motion.div
              className="relative w-32 h-32 mb-8"
              initial={{ y: -300, scale: 0.5, opacity: 0 }}
              animate={{ 
                y: showSplash ? 0 : [-300, 0],
                scale: showSplash ? 0 : [0.5, 1],
                opacity: showSplash ? 0 : 1
              }}
              transition={{
                duration: 1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {!showSplash && (
                <svg
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                  fill="url(#mainDropGradient)"
                >
                  <defs>
                    <linearGradient id="mainDropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              )}
            </motion.div>

            {/* Scatter/Splash effect */}
            {showSplash && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Impact ripples */}
                <motion.div
                  className="absolute w-40 h-40 border-4 border-green-400 rounded-full"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 2, 3],
                    opacity: [1, 0.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeOut",
                  }}
                />
                <motion.div
                  className="absolute w-32 h-32 border-4 border-blue-400 rounded-full"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 2.5, 3.5],
                    opacity: [1, 0.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.1,
                    ease: "easeOut",
                  }}
                />

                {/* Scattered water particles */}
                {scatterParticles.map((index) => {
                  const angle = (index * 30) * Math.PI / 180; // 360° / 12 particles
                  const distance = 150 + Math.random() * 100;
                  const x = Math.cos(angle) * distance;
                  const y = Math.sin(angle) * distance;
                  const size = 8 + Math.random() * 12;

                  return (
                    <motion.div
                      key={index}
                      className="absolute"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: x,
                        y: y,
                        scale: [0, 1, 0.5, 0],
                        opacity: [1, 1, 0.5, 0],
                      }}
                      transition={{
                        duration: 1.2,
                        delay: Math.random() * 0.2,
                        ease: "easeOut",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-full h-full"
                        fill="url(#scatterGradient)"
                      >
                        <defs>
                          <linearGradient id="scatterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* PujiGori Logo/Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="text-center mt-32"
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                <span className="text-green-600">Puji</span>
                <span className="text-gray-800">Gori</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Risk-Free Financing Starts Here
              </p>
            </motion.div>

            {/* Loading text with dots */}
            <motion.div
              className="mt-8 flex items-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <span className="text-gray-500 text-sm">Loading</span>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block w-1 h-1 bg-green-600 rounded-full"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mt-6 w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WaterDropLoader;