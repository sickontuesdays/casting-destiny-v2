/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    domains: ['www.bungie.net', 'bungie.net'],
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables to expose to the browser
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    BUNGIE_CLIENT_ID: process.env.BUNGIE_CLIENT_ID,
    BUNGIE_CLIENT_SECRET: process.env.BUNGIE_CLIENT_SECRET,
    BUNGIE_API_KEY: process.env.BUNGIE_API_KEY,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXTAUTH_URL || 'https://casting-destiny.vercel.app'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      },
      {
        // Apply security headers to all pages
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/api/auth/bungie-login',
        permanent: false,
      },
      {
        source: '/logout',
        destination: '/api/auth/logout',
        permanent: false,
      }
    ]
  },

  // Webpack configuration for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all'
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        destiny: {
          test: /[\\/]lib[\\/]destiny-intelligence[\\/]/,
          name: 'destiny-intelligence',
          chunks: 'all',
        }
      }
    }

    return config
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Output configuration for different deployment targets
  output: process.env.DEPLOY_TARGET === 'standalone' ? 'standalone' : undefined,

  // Trailing slash configuration
  trailingSlash: false,

  // Power by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Generate ETags
  generateEtags: true,

  // Production optimizations
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig