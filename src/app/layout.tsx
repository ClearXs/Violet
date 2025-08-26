'use client';

import '@/index.css';
import '@/global.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster as SonnerToast } from '@/components/ui/sonner';
import { LayoutProvider } from '@/context/layout-context';
import { Progress } from '@/components/ui/progress';
import NextIntlProvider from '@/context/next-int-context';
import { FontProvider } from '@/context/font-context';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [initial, setInitial] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        router.push('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const tm = setTimeout(() => {
      setInitial(true);
    }, 3000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      tm.close();
    };
  }, []);

  return (
    <html lang='en'>
      <body>
        <LayoutProvider>
          <NextIntlProvider>
            <FontProvider>{children}</FontProvider>
          </NextIntlProvider>
        </LayoutProvider>
        <SonnerToast />
      </body>
    </html>
  );
}
