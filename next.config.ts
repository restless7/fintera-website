import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**'
    }]
  },
  
  // Webpack configuration for pdf-lib compatibility
  webpack: (config, { isServer }) => {
    // Fix for pdf-lib and other packages that use eval()
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Experimental features for better API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase if needed for large PDFs
    },
  },
};

export default nextConfig;
