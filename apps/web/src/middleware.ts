import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|yo|pcm)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
