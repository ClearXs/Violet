import { create } from 'zustand';
import { IconUser } from '@tabler/icons-react';
import { SidebarNavProps } from '@/components/sidebar-nav';

type SettingKey = 'model' | 'embedding' | 'tts' | 'whisper';

const settingItems: SidebarNavProps['items'] = [
  {
    key: 'model',
    title: 'Model',
    icon: <IconUser size={18} />,
  },
  {
    key: 'embedding',
    title: 'Embedding',
    icon: <IconUser size={18} />,
  },
  {
    key: 'tts',
    title: 'TTS',
    icon: <IconUser size={18} />,
  },
  {
    key: 'whisper',
    title: 'Whisper',
    icon: <IconUser size={18} />,
  },
];

type State = {
  open: boolean;
  settingItems: SidebarNavProps['items'];
  selectKey: SettingKey;
};

type Action = {
  setOpen: (open: boolean) => void;
  setSelectKey: (key: SettingKey) => void;
  reset: () => void;
};

const useSettingsStore = create<State & Action>((set) => ({
  open: false,
  settingItems,
  selectKey: 'model',
  setSelectKey: (key) => set({ selectKey: key }),
  reset: () => set({ selectKey: 'model' }),
  setOpen(open) {
    set({ open });
  },
}));

export default useSettingsStore;
