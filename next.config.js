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
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.bungie.net https://bungie.net; connect-src 'self' https://www.bungie.net https://bungie.net; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
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

    // Enable WebAssembly (if needed for future optimizations)
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },

  // Experimental features
  experimental: {
    // Enable App Router when ready to migrate
    appDir: false,
    
    // Optimize server components
    serverComponentsExternalPackages: ['jose'],
    
    // Runtime optimizations
    runtime: 'nodejs',
    
    // Enable SWC plugins if needed
    swcPlugins: [],
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

  // Development-specific configurations
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    }
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production for better performance
    productionBrowserSourceMaps: false,
    
    // Optimize images
    images: {
      ...nextConfig.images,
      minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    }
  })
}

module.exports = nextConfig