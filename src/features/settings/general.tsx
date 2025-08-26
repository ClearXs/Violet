'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import ContentSection from './components/content-section';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export type SettingsProfileProps = {};

export default function SettingsGeneral({ config }: SettingsProfileProps) {
  const router = useRouter();

  return (
    <ContentSection
      title='General'
      desc='This is how others will see you on the site.'
    >
      <ScrollArea className='flex-1 -mx-1 px-3'>
        <div className='flex flex-col gap-2'>
          <Button
            className='w-full h-12'
            onClick={() => router.push('/settings/general/model')}
          >
            Model Configuration
          </Button>
          <Button
            className='w-full h-12'
            onClick={() => router.push('/settings/general/embedding')}
          >
            Embedding Model Configuration
          </Button>
          <Button
            className='w-full h-12'
            onClick={() => router.push('/settings/general/stt')}
          >
            Speech-To-Text Configuration
          </Button>
          <Button
            className='w-full h-12'
            onClick={() => router.push('/settings/general/tts')}
          >
            Text-To-Speech Configuration
          </Button>
        </div>
      </ScrollArea>
    </ContentSection>
  );
}
