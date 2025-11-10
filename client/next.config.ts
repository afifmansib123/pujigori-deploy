import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['anewtestingbucketisbetter.s3.ap-southeast-1.amazonaws.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable static page generation to avoid Html import errors from AWS Amplify
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@aws-amplify/ui-react'],
  },
};

export default nextConfig;