'use client';

import SidebarNav from '@/components/sidebar-nav';
import SettingsGeneral from '@/features/settings/general';
import SettingsPersonas from '@/features/settings/personas';
import SettingsAgents from '@/features/settings/agents';
import SettingsMemory from '@/features/settings/memory';
import useSettingsStore from '@/store/settings';

export type SettingsProps = {
};

export default function Settings(props: SettingsProps) {
  const settingStore = useSettingsStore();

  return (
    <div className='flex flex-row space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 h-full'>
      <aside className='top-0 lg:sticky lg:w-1/5'>
        <SidebarNav
          items={settingStore.settingItems}
          selectKey={settingStore.selectKey}
          onSelectKey={settingStore.setSelectKey}
        />
      </aside>
      <div className='w-full h-full p-4'>
        {settingStore.selectKey === 'general' && <SettingsGeneral {...props} />}
        {settingStore.selectKey === 'personas' && <SettingsPersonas {...props} />}
        {settingStore.selectKey === 'agents' && <SettingsAgents {...props} />}
        {settingStore.selectKey === 'memory' && <SettingsMemory {...props} />}
      </div>
    </div>
  );
}
