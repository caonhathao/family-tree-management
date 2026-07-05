import { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
          },
        ],
        // Exclude static and image paths covered above
      },
    ];
  },
  reactCompiler: true,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "@prisma/client-runtime-utils",
    "bcrypt",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
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
