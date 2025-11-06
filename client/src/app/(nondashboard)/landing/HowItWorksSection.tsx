"use client"
import {motion} from "framer-motion"
import Image from "next/image"

// a variant for the containers
const containerVariants = {
    hidden : {opacity : 0  , y: 20},
    visible : {
        opacity : 1, 
        y : 0,
        transition : {
            duration : 0.8,
            staggerChildren : 0.3,
        }
    }
}

// a variant for items inside 
const itemVariants = {
    hidden : {opacity : 0, y : 30},
    visible : {
        opacity : 1, 
        y : 0,
        transition: {
            duration: 0.6
        }
    },
}

// Variant for the image/video placeholder
const imageVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.8
        }
    }
}

// Variant for step items
const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.6
        }
    }
}

const HowItWorksSection = () => {
    const steps = [
        {
            number: 1,
            title: "Lorem ipsum dolor sit amet",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
        },
        {
            number: 2,
            title: "Lorem ipsum dolor sit amet", 
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
        },
        {
            number: 3,
            title: "Lorem ipsum dolor sit amet",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
        }
    ]

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            className="py-16 px-6 sm:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-green-50 to-blue-50">
            
            <div className="max-w-7xl mx-auto">
                {/* Header with icons and lorem text */}
                <motion.div 
                    variants={itemVariants}
                    className="text-center mb-16">
                    
                    {/* Top icons row */}
                    <div className="flex justify-center items-center gap-8 mb-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
                                <span className="text-xs">⚡</span>
                            </div>
                            <span>"Sed ut perspiciatis unde"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-5 h-5 bg-red-400 rounded flex items-center justify-center">
                                <span className="text-xs">♥</span>
                            </div>
                            <span>"Sed ut perspiciatis unde"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-5 h-5 bg-blue-400 rounded flex items-center justify-center">
                                <span className="text-xs">📊</span>
                            </div>
                            <span>"Sed ut perspiciatis unde"</span>
                        </div>
                    </div>

                    {/* Lorem ipsum paragraph */}
                    <p className="text-gray-700 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exerc"
                    </p>

                    {/* Main heading */}
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">
                        HOW IT WORKS
                    </h2>
                </motion.div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    
                    {/* Left side - Image/Video placeholder */}
                    <motion.div
                        variants={imageVariants}
                        className="order-2 lg:order-1">
                        <div className="bg-gray-300 rounded-3xl aspect-[4/5] flex items-center justify-center shadow-lg">
                            {/* Placeholder for image or video */}
                            <div className="text-gray-500 text-center">
                                <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">▶</span>
                                </div>
                                <p>Video/Image Placeholder</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right side - Steps */}
                    <motion.div 
                        variants={containerVariants}
                        className="order-1 lg:order-2 space-y-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                variants={stepVariants}
                                custom={index}
                                className="flex items-start gap-6">
                                
                                {/* Step number */}
                                <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700 shadow-sm">
                                    {step.number}
                                </div>

                                {/* Step content */}
                                <div className="flex-1 pt-1">
                                    {/* Green pill title */}
                                    <div className="bg-green-600 text-white px-6 py-3 rounded-full mb-3 inline-block">
                                        <h3 className="font-semibold text-sm">
                                            {step.title}
                                        </h3>
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="text-gray-600 leading-relaxed italic">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </motion.section>
    )
}

export default HowItWorksSection;