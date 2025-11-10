import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./provider";
import WaterDropLoader from "@/components/WaterDropLoader";
import { LoadingProvider } from "@/contexts/LoadingContext";

// Temporarily disabled Google Fonts due to network issues in build environment
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "PujiGori - Risk-Free Financing Starts Here",
  description: "1st crowdfunding platform in Bangladesh for startups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
      >
        <Providers>
          <LoadingProvider>
            <WaterDropLoader />
            {children}
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  );
}