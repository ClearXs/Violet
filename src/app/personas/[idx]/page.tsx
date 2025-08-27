'use client';

import DraggableWrapper from '@/components/dragble-wrapper';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import VrmViewer from '@/components/vrmViewer';
import { useLayout } from '@/context/layout-context';
import usePersonaApi, { Personas } from '@/services/personas';
import { IconArrowLeft } from '@tabler/icons-react';
import { ChevronDown, Maximize, Minimize } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

export default function PersonaDetails({
  params,
}: {
  params: Promise<{ idx: string }>;
}) {
  const { idx } = use(params);
  const router = useRouter();
  const layout = useLayout();
  const personaApi = usePersonaApi();
  const [persona, setPersona] = useState<Personas | undefined>();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    personaApi.getPersona(idx!).then((data) => {
      setPersona(data);
    });
  }, []);

  return (
    <div className='p-3'>
      <header className='flex flex-col gap-1'>
        <Button
          size='icon'
          onClick={() => {
            layout.show();
            router.back();
          }}
        >
          <IconArrowLeft />
        </Button>
      </header>

      <DraggableWrapper
        title='Knowledge Source'
        width='min-w-96'
        className='z-[100]'
        fullScreenWidth='60%'
        fullScreenHeight='auto'
        defaultPosition={{ x: 0, y: 100 }}
        onFullScreenChange={setIsFullScreen}
        maximizeButton={
          <Button variant='ghost' size='sm' className='rounded-md p-2'>
            {isFullScreen ? (
              <Minimize strokeWidth={3} className='size-4' />
            ) : (
              <Maximize strokeWidth={3} className='size-4' />
            )}
          </Button>
        }
        minimizeButton={
          <Button variant='ghost' size='sm' className='rounded-md p-2'>
            <ChevronDown strokeWidth={3} className='size-4' />
          </Button>
        }
      >
        <ScrollArea className='p-1'>
          <div>11</div>
        </ScrollArea>
      </DraggableWrapper>

      {persona && (
        <VrmViewer
          vrm={`/api/file/download?path=${
            persona.r_path + '/' + persona.config?.vrm
          }`}
          motion={{
            idle_loop: `/api/file/download?path=${
              persona.r_path + '/' + persona.config?.motion.idle_loop
            }`,
          }}
        />
      )}
    </div>
  );
}
