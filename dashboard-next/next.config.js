/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['cdn.discordapp.com'],
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: '/api',
    NEXT_PUBLIC_CLIENT_ID: '1014305078997422111',
  },
};

module.exports = nextConfig;