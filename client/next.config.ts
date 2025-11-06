import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['anewtestingbucketisbetter.s3.ap-southeast-1.amazonaws.com'],
  },
    eslint: {
    ignoreDuringBuilds: true,  // ADD THIS LINE
  },
};

export default nextConfig;