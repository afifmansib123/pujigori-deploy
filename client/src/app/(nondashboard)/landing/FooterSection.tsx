"use client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          
          {/* Follow Us Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Facebook"
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FontAwesomeIcon icon={faFacebook} className="h-6 w-6 text-gray-700 hover:text-green-600" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FontAwesomeIcon icon={faTwitter} className="h-6 w-6 text-gray-700 hover:text-green-600" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} className="h-6 w-6 text-gray-700 hover:text-green-600" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 transition-colors"
              >
                <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6 text-gray-700 hover:text-green-600" />
              </a>
            </div>
          </div>

          {/* Our Office Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Office</h3>
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 underline">
                  Government Building, Dhaka, Bangladesh
                </p>
                <p className="text-gray-700 mt-2">Office Hours: Mon-Fri, 9:00 AM - 6:00 PM</p>
                <p className="text-gray-700">
                  Email: <Link href="mailto:support@pujigori.com" className="underline hover:text-green-600">support@pujigori.com</Link>
                </p>
                <p className="text-gray-700">
                  Phone: <Link href="tel:+8801234567889" className="underline hover:text-green-600">+880 123 456 789</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-700 hover:text-green-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-700 hover:text-green-600 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-700 hover:text-green-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-700 hover:text-green-600 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-700 hover:text-green-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Second Row - 3 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Customer Support Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Support</h3>
            <p className="text-gray-700 mb-4">
              Need help? Reach out to our 24/7 customer support team for any inquiries or issues.
            </p>
            <p className="text-gray-700 mb-2">
              <Link href="mailto:support@pujigori.com" className="underline hover:text-green-600">Email Us</Link>
            </p>
            <p className="text-gray-700">
              Call: <Link href="tel:+8801234567889" className="underline hover:text-green-600">+880 123 456 789</Link>
            </p>
          </div>

          {/* Legal Notices Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Legal Notices</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/disclaimer" className="text-gray-700 hover:text-green-600 transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-gray-700 hover:text-green-600 transition-colors">
                  Compliance with Bangladesh Law
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-700 hover:text-green-600 transition-colors">
                  Security Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* News & Updates Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">News & Updates</h3>
            <p className="text-gray-700 mb-4">
              Stay updated with the latest news and announcements about Pujigori Crowdfunding.
            </p>
            <Link href="/blog" className="text-green-600 hover:text-green-700 font-semibold underline">
              Visit Our Blog
            </Link>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="text-center">
            <p className="text-gray-600">
              © 2025 PujiGori. All rights reserved. Built with ❤️ in Bangladesh.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;