"use client"
import FAQAndTestimonialsSection from "./FAQAndTestimonialsSection"
import HowItWorksSection from "./HowItWorksSection"
import FooterSection from "./FooterSection"
import HeroSection from "./HeroSection"

const Landing = () => {
    return (
        <div>
            <HeroSection />
            <HowItWorksSection/>
            <FAQAndTestimonialsSection/>
            <FooterSection/>
        </div>
    )
}

export default Landing