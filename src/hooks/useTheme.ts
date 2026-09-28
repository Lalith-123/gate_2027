import { useEffect } from 'react';
import { useUser } from '@/state/UserStore';

/**
 * Keeps <html data-theme> and the reduce-motion class in sync with settings.
 * Also follows the OS while the theme is set to "system".
 */
export function useTheme() {
  const { settings, updateSettings } = useUser();
  const mode = settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && media.matches);
      root.dataset.theme = dark ? 'dark' : 'light';
      root.style.colorScheme = dark ? 'dark' : 'light';

      const themeColor = dark ? '#0B1020' : '#F8FAFC';
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
        meta.content = themeColor;
      }
    };

    apply();
    if (mode !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings.reduceMotion]);

  return {
    theme: mode,
    setTheme: (theme: 'light' | 'dark' | 'system') => updateSettings({ theme }),
  };
}
