import { createContext, useMemo, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import SettingsDialog from '@/features/settings/settings-dialog';
import React from 'react';
import { Button } from '@/components/ui/button';
import { IconSettings } from '@tabler/icons-react';
import useSettingsStore from '@/store/settings';

type LayoutContextType = {
  display: boolean;
  show: () => void;
  hide: () => void;
};

const LayoutContext = createContext<LayoutContextType>(null);

interface Props {
  children: React.ReactNode;
}

export const LayoutProvider = ({ children }: Props) => {
  const [hasLayout, setHasLayout] = useState<boolean>(true);

  const { setOpen } = useSettingsStore();

  const value = useMemo<LayoutContextType>(() => {
    return {
      display: hasLayout,
      show() {
        setHasLayout(true);
      },
      hide() {
        setHasLayout(false);
      },
    };
  }, [hasLayout]);

  return (
    <LayoutContext.Provider value={value}>
      {hasLayout ? (
        <div className='flex h-[100dvh] w-full overflow-hidden'>
          <SidebarProvider open={false}>
            <AppSidebar
              footer={
                <Button
                  size='icon'
                  className='w-full'
                  onClick={() => setOpen(true)}
                >
                  <IconSettings />
                </Button>
              }
            />
            <main className='flex flex-col flex-1 min-w-0'>
              <div className='flex-1 overflow-hidden'>{children}</div>
            </main>
            <SettingsDialog />
          </SidebarProvider>
        </div>
      ) : (
        <div className='h-[100dvh] w-full overflow-hidden'>{children}</div>
      )}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const layoutContext = React.useContext(LayoutContext);

  if (!layoutContext) {
    throw new Error('useSearch has to be used within <LayoutContext.Provider>');
  }

  return layoutContext;
};
