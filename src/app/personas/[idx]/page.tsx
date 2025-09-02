'use client';

import DraggableWrapper from '@/components/dragble-wrapper';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayout } from '@/context/layout-context';
import usePersonaApi, { Personas } from '@/services/personas';
import { IconArrowLeft } from '@tabler/icons-react';
import { ChevronDown, Maximize, Minimize, SaveIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import Avatar from '@/features/avatar';
import PersonaForm from '@/features/persona/PersonaForm';

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
  }, [idx]);

  return (
    <div className='h-full w-full'>
      <header className='absolute w-full h-12 top-0 flex flex-row justify-center items-center gap-1 p-3 bg-[var(--sidebar-primary-foreground)]'>
        <Button
          size='icon'
          onClick={() => {
            layout.show();
            router.back();
          }}
        >
          <IconArrowLeft />
        </Button>

        <Button className='ml-auto'>
          <SaveIcon /> Apply
        </Button>
      </header>

      <DraggableWrapper
        title={persona?.name}
        width='min-w-96'
        className='z-[100]'
        fullScreenWidth='60%'
        fullScreenHeight='auto'
        defaultPosition={{ x: 0, y: 50 }}
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
        <ScrollArea className='flex-1 px-4 h-[400px]'>
          <PersonaForm persona={persona} />
        </ScrollArea>
      </DraggableWrapper>

      {persona && (
        <Avatar
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
