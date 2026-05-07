/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@AfriWage/sdk'],
  webpack: (config, { isServer }) => {
    // Stellar SDK uses Node.js built-ins that need to be polyfilled for browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Fix "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
    // and "Module not found: Can't resolve 'sodium-native'"
    if (!isServer) {
      config.resolve.fallback.crypto = false;
    }

    return config;
  },
  experimental: {
    // Required for monorepo workspace packages
    externalDir: true,
  },
};

export default nextConfig;
