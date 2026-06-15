/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production builds on lint issues (e.g. unused vars).
    // Lint still runs locally via `npm run lint`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
