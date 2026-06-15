'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from '@/i18n/constants';
import { type Locale, routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  yo: 'Yorùbá',
  pcm: 'Pidgin',
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, [locale]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (nextLocale: Locale) => {
    setOpen(false);
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-[#d8cebe] bg-white px-3 py-2 text-sm font-semibold text-[#102033] shadow-[0_8px_24px_rgba(16,32,51,0.06)] transition-colors hover:bg-[#fffaf2] disabled:opacity-60"
        aria-label={t('label')}
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 text-[#637085]" />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 min-w-[10rem] rounded-xl border border-[#d8cebe] bg-white p-2 shadow-xl">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLocaleChange(loc)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                loc === locale
                  ? 'bg-[#102033] font-semibold text-white'
                  : 'text-[#415065] hover:bg-[#f6efe6]'
              )}
            >
              <span>{localeLabels[loc]}</span>
              <span className="text-xs uppercase opacity-70">{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
