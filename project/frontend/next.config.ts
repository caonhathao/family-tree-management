import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Giữ nguyên cấu hình để xử lý các gói Prisma/DB phức tạp
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "@prisma/client-runtime-utils",
    "bcrypt",
  ],
  images: {
    remotePatterns: [
      { hostname: "picsum.photos", protocol: "https" },
      { hostname: "salt.tikicdn.com", protocol: "https" },
      { hostname: "res.cloudinary.com", protocol: "https" },
      { hostname: "img.icons8.com", protocol: "https" },
      { hostname: "cdn.jsdelivr.net", protocol: "https" },
      { hostname: "avatars.githubusercontent.com", protocol: "https" },
      { hostname: "placehold.co", protocol: "https", pathname: "/**" },
    ],
  },
};

export default nextConfig;
