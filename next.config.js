/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'playwright']
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DATABASE: process.env.MONGODB_DATABASE,
    MONGODB_COLLECTION: process.env.MONGODB_COLLECTION,
  }
}

module.exports = nextConfig