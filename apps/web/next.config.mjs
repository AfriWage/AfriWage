import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
    // Enable src/instrumentation.ts so required server env vars are validated at startup
    instrumentationHook: true,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // See https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
});
