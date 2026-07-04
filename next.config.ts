import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.dmrilaclama.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/fare",
        destination: "/hasere/fare-kemirgen",
        permanent: true,
      },
      {
        source: "/orumcek",
        destination: "/hasere/orumcek-ilaclama",
        permanent: true,
      },
      {
        source: "/pire",
        destination: "/hasere/pire-ilaclama",
        permanent: true,
      },
      {
        source: "/bocek-ilaclama",
        destination: "/hizmetler",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
