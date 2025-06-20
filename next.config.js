/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker/Cloud deployment
  output: 'standalone',
  
  // Enable static file optimization
  compress: true,
  poweredByHeader: false,
  
  // External packages that should not be bundled by webpack for server components
  serverExternalPackages: [
    'snarkjs',
    'circomlib',
    'circom',
    'ffjavascript',
    'winston',
    '@web3-storage/w3up-client'
  ],

  // Webpack configuration to handle specific modules
  webpack: (config, { buildId: _buildId, dev: _dev, isServer, defaultLoaders: _defaultLoaders, webpack: _webpack }) => {
    // Handle .node files (for native modules like circom)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Externalize packages for server-side
    if (isServer) {
      config.externals.push({
        'snarkjs': 'snarkjs',
        'circomlib': 'circomlib',
        'circom': 'circom',
        'ffjavascript': 'ffjavascript',
        'winston': 'winston',
        '@web3-storage/w3up-client': '@web3-storage/w3up-client'
      });
    }

    // Handle ESM packages properly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };

    return config;
  },

  // Environment variables to expose to the browser
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://*.cloud.run',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for Next.js 15
  experimental: {
    // Server-side compilation improvements
    forceSwcTransforms: true,
    disableOptimizedLoading: true
  },
};

module.exports = nextConfig; 