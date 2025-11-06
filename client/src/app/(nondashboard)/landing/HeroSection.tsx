"use client";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create staggered animation for each circle
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.8, // Each circle glows for 0.8 seconds before moving to next
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  const circleVariants = {
    hidden: { 
      scale: 1
    },
    visible: { 
      scale: [1, 1.05, 1.1, 1.05, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  const glowEffectVariants = {
    hidden: { 
      opacity: 0,
      scale: 1
    },
    visible: { 
      opacity: [0, 0.6, 0.8, 0.6, 0],
      scale: [1, 1.2, 1.4, 1.2, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  // Adjusted radius and positions to prevent overlap with text
  // Increased radius for better spacing with bigger images
  const radius = isMobile ? 150 : 260;
  const circleImages = [
    { 
      id: 1, 
      src: "/pic1.png", 
      alt: "Healthcare",
      angle: 0 // Top (12 o'clock)
    },
    { 
      id: 2, 
      src: "/pic2.png", 
      alt: "Global Network",
      angle: 60 // Top-right (2 o'clock)
    },
    { 
      id: 3, 
      src: "/pic3.png", 
      alt: "Business Analytics",
      angle: 120 // Bottom-right (4 o'clock)
    },
    { 
      id: 4, 
      src: "/pic1.png", 
      alt: "Education",
      angle: 180 // Bottom (6 o'clock)
    },
    { 
      id: 5, 
      src: "/pic2.png", 
      alt: "Investment",
      angle: 240 // Bottom-left (8 o'clock)
    },
    { 
      id: 6, 
      src: "/pic3.png", 
      alt: "Travel",
      angle: 300 // Top-left (10 o'clock)
    }
  ];

  // Don't render the positioned elements until we're on the client
  if (!isClient) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        {/* Background circles for decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-300 rounded-full opacity-15"></div>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-6xl px-4 sm:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-800 mb-4 sm:mb-6">
              Risk-Free
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-800 mb-2 sm:mb-4">
              Financing
            </h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-800 mb-6 sm:mb-8">
              start here
            </h3>
            <button className="bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold hover:bg-green-700 transition-colors duration-300">
              DONATE
            </button>
            <p className="text-lg sm:text-xl text-gray-700 mt-6 sm:mt-8 font-medium px-4">
              1st crowdfunding platform in Bangladesh for startups
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden py-12">
      {/* Background circles for decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-300 rounded-full opacity-15"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* Circle of images with text inside */}
        <div className="relative mb-12">
          {/* Animated circular images */}
          <motion.div
            className="relative"
            style={{
              width: isMobile ? '360px' : '600px',
              height: isMobile ? '360px' : '600px'
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {circleImages.map((image, index) => {
              // Convert angle to radians and calculate x, y position
              const angleInRadians = (image.angle * Math.PI) / 180;
              const x = Math.cos(angleInRadians) * radius;
              const y = Math.sin(angleInRadians) * radius;
              
              return (
                <motion.div
                  key={image.id}
                  className={`absolute ${isMobile ? 'w-24 h-24' : 'w-36 h-36'}`}
                  style={{
                    left: `calc(50% + ${x}px - ${isMobile ? '3rem' : '4.5rem'})`,
                    top: `calc(50% + ${y}px - ${isMobile ? '3rem' : '4.5rem'})`,
                  }}
                  variants={circleVariants as any}
                  custom={index}
                >
                  {/* Green glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(34, 197, 94, 0.3) 40%, transparent 70%)',
                      filter: `blur(${isMobile ? '10px' : '15px'})`,
                      transform: 'scale(1.5)'
                    }}
                    variants={glowEffectVariants as any}
                    custom={index}
                  />
                  
                  {/* Main circular image */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-full relative z-10"
                  />
                </motion.div>
              );
            })}

            {/* Center content - Risk-Free, Financing, start here text and DONATE button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2">
                Risk-Free
              </h1>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2">
                Financing
              </h2>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                start here
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors duration-300"
              >
                DONATE
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom text content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-center max-w-6xl px-4 sm:px-8"
        >
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-700 font-medium px-4 mb-12">
            1st crowdfunding platform in Bangladesh for startups
          </p>

          {/* Bottom content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 text-center lg:text-left">
            <div className="px-2">
              <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                More than Tk 50 million is raised every week on PujiGori.*
              </h4>
            </div>
            
            <div className="px-2">
              <p className="text-base sm:text-lg text-gray-700">
                Get started in just a few minutes — with helpful new tools, it's easier 
                than ever to pick the perfect title, write a compelling story, and share 
                it with the world.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;