import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Cấu hình cho phép load ảnh từ Cloudinary (Đã làm từ trước)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
  },

  // 2. THÊM ĐOẠN NÀY ĐỂ TĂNG GIỚI HẠN UPLOAD
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Tăng lên 4MB
    },
  },
};

export default nextConfig;