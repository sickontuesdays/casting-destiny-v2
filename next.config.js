/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BUNGIE_API_KEY: process.env.BUNGIE_API_KEY,
  },
}

module.exports = nextConfig
