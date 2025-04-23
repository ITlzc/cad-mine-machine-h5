const { NEXT_QUERY_PARAM_PREFIX } = require('next/dist/lib/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!backendUrl) {
            console.warn('Warning: NEXT_PUBLIC_BACKEND_URL is not defined');
            return [];
        }
        return [
          {
            source: "/api/v1/:path*", 
            destination: `${backendUrl}/api/v1/:path*`,
          },
        ];
    },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image-resource.mastergo.com',
      },
      {
        protocol: 'https',
        hostname: 'ai-public.mastergo.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
//   headers: [
//     {
//       key: "Link",
//       value: "</images/favicon.ico>; rel=icon",
//     },
//   ],
}

module.exports = nextConfig 