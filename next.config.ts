import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['lying-yeast-sequence-consensus.trycloudflare.com'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'naili.ai' },
      { protocol: 'https', hostname: 'vision-shield-wheat.vercel.app' },
    ],
  },
};

export default nextConfig;
