/** @type {import('next').NextConfig} */
const nextConfig = {
 reactStrictMode: true,
 async redirects() {
  return [
   { source: '/connect', destination: '/pro', permanent: false },
   { source: '/dashboard', destination: '/my-projects', permanent: false },
   { source: '/for-contractors', destination: '/pro', permanent: false },
   { source: '/shield', destination: '/vision/start', permanent: false },
   { source: '/shield/:path*', destination: '/vision/start', permanent: false },
   { source: '/auth/:path*', destination: '/', permanent: false },
   { source: '/cost-guides', destination: '/', permanent: false },
   { source: '/cost-guides/:path*', destination: '/', permanent: false },
   { source: '/share/:path*', destination: '/my-projects', permanent: false },
   { source: '/admin/:path*', destination: '/pro', permanent: false },
  ];
 },
 images: {
  remotePatterns: [
   { protocol: "https", hostname: "placehold.co" },
   { protocol: "https", hostname: "images.unsplash.com" },
  ],
 },
};

module.exports = nextConfig;
