import * as Sentry from '@sentry/nextjs';
import { beforeSend, isSentryEnabled } from './src/lib/sentry';

if (isSentryEnabled()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend,
    enabled: isSentryEnabled(),
  });
}
