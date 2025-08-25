'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import ContentSection from './components/content-section';

export type SettingsProfileProps = {}


export default function SettingsMemory({ config }: SettingsProfileProps) {

  return (
    <ContentSection
      title='Memory'
      desc='This is how others will see you on the site.'
    >
      <ScrollArea className='flex-1 -mx-1 px-3'>
        <></>
      </ScrollArea>
    </ContentSection>
  );
}
