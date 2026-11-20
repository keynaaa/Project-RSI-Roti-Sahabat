/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gunakan webpack bundler (Turbopack dinonaktifkan karena environment restriction)
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
