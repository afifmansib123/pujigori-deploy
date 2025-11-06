"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const FAQAndTestimonialsSection = () => {

  const faqItems = [
    {
      id: 1,
      icon: "⚙️",
      question: "How it works?",
      answer: "Our platform connects investors with verified startups. You can browse projects, invest securely, and track your investments through our dashboard."
    },
    {
      id: 2,
      icon: "🛡️",
      question: "Is this safe?",
      answer: "Yes, we use bank-level security, conduct thorough due diligence on all projects, and provide transparent reporting to ensure your investments are protected."
    },
    {
      id: 3,
      icon: "📊",
      question: "Is PujiGori Legitimate?",
      answer: "PujiGori is fully licensed and regulated. We comply with all financial regulations and have successfully helped hundreds of startups raise funding."
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "JOHN DOE",
      position: "Executive Manager",
      avatar: "/api/placeholder/80/80",
      quote: "Sed ut perspiciatis unde omnise dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
      rating: 5
    },
    {
      id: 2,
      name: "JANE SMITH", 
      position: "Investment Director",
      avatar: "/api/placeholder/80/80",
      quote: "Sed ut perspiciatis unde omnise dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
      rating: 5
    },
    {
      id: 3,
      name: "MIKE JOHNSON",
      position: "Startup Founder",
      avatar: "/api/placeholder/80/80", 
      quote: "Sed ut perspiciatis unde omnise dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
      rating: 5
    },
    {
      id: 4,
      name: "MIKE JOHNSON",
      position: "Startup Founder",
      avatar: "/api/placeholder/80/80", 
      quote: "Sed ut perspiciatis unde omnise dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
      rating: 5
    }
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
      {/* FAQ Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-12 mb-20"
      >
        {/* FAQ Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-block bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold mb-8">
            Frequently Ask Questions
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div variants={containerVariants} className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              custom={index}
              className="bg-green-600 text-white rounded-full px-4 py-4 flex items-center justify-between hover:bg-green-700 transition-colors cursor-pointer group"
            >
              {/* Left Icon */}
              <div className="flex-shrink-0">
                <span className="text-2xl">{item.icon}</span>
              </div>
              
              {/* Center Text */}
              <div className="flex-1 text-center px-4">
                <h3 className="text-xl font-semibold">{item.question}</h3>
              </div>
              
              {/* Right Arrow */}
              <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-2 group-hover:bg-opacity-30 transition-all">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <button className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-2 rounded-full hover:bg-gray-50 transition-colors">
            View All
          </button>
          <p className="text-gray-600 text-sm mt-4 italic">
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
          </p>
        </motion.div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
      >
        {/* Testimonials Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
            Testimonials from our valuable investors
          </h2>
          <div className="w-24 h-1 bg-green-600 mx-auto"></div>
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div variants={itemVariants} className="relative">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 md:basis-1/3">
                  <motion.div
                    className="bg-green-600 text-white rounded-3xl p-6 relative h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Quote Icon */}
                    <div className="absolute top-4 left-6">
                      <svg className="w-8 h-8 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                      </svg>
                    </div>

                    {/* Avatar */}
                    <div className="absolute top-4 right-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-20">
                      <p className="text-sm leading-relaxed mb-6">
                        "{testimonial.quote}"
                      </p>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <h4 className="font-bold text-sm">{testimonial.name}</h4>
                          <p className="text-xs opacity-90">{testimonial.position}</p>
                        </div>
                        
                        {/* Quote Icon Bottom Right */}
                        <div className="text-white opacity-30">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h10zm14.017 0v7.391c0 5.704-3.748 9.57-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-4v-10h10z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation Buttons */}
            <CarouselPrevious className="left-0 bg-white border-2 border-gray-300 hover:bg-gray-50" />
            <CarouselNext className="right-0 bg-white border-2 border-gray-300 hover:bg-gray-50" />
          </Carousel>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FAQAndTestimonialsSection;