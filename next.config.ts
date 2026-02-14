import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**', // Cho phép mọi đường dẫn từ cloudinary
      },
    ],
  },
};

export default nextConfig;
