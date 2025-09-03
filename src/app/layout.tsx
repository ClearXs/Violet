'use client';

import '@/index.css';
import '@/global.css';
import { useEffect, useState } from 'react';
import { Toaster as SonnerToast } from '@/components/ui/sonner';
import { LayoutProvider, useLayout } from '@/context/layout-context';
import { Progress } from '@/components/ui/progress';
import NextIntlProvider from '@/context/next-int-context';
import { FontProvider } from '@/context/font-context';
import useSettingsStore from '@/store/settings';
import useConfigStore from '@/store/config';
import useConfigApi from '@/services/config';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initial, setInitial] = useState<boolean>(false);

  const { setOpen } = useSettingsStore();
  const configStore = useConfigStore();

  const [progress, setProgress] = useState(0);

  const configApi = useConfigApi();

  // quickly open settings panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        setOpen(true);
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

  // initialize system
  useEffect(() => {
    // set config
    Promise.all([
      configApi.getVioletConfig(),
      configApi.getLLMConfig(),
      configApi.getEmbeddingConfig(),
      configApi.getTTSConfig(),
      configApi.getWhisperConfig(),
    ])
      .then(
        ([
          violetConfig,
          llmConfig,
          embeddingConfig,
          ttsConfig,
          whisperConfig,
        ]) => {
          configStore.setSystemConfig(violetConfig);
          configStore.setLLMConfig(llmConfig);
          configStore.setEmbeddingConfig(embeddingConfig);
          configStore.setTTSConfig(ttsConfig);
          configStore.setWhisperConfig(whisperConfig);
        }
      )
      .finally(() => {
        setInitial(true);
      });
  }, []);

  return (
    <html lang='en'>
      <body>
        {initial ? (
          <LayoutProvider>
            <NextIntlProvider>
              <FontProvider>{children}</FontProvider>
            </NextIntlProvider>
          </LayoutProvider>
        ) : (
          <div className='h-full w-full absolute flex justify-center items-center'>
            <Progress className='w-[20%] h-4' value={progress}></Progress>
          </div>
        )}
        <SonnerToast />
      </body>
    </html>
  );
}
