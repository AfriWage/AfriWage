import * as Sentry from '@sentry/nextjs';
import { beforeSend, isSentryEnabled } from './src/lib/sentry';

if (isSentryEnabled()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    beforeSend,
    enabled: isSentryEnabled(),
  });
}
