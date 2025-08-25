import { create } from 'zustand';
import {
  IconUser,
} from '@tabler/icons-react';
import { SidebarNavProps } from '@/components/sidebar-nav';

type SettingKey =
  | 'general'
  | 'personas'
  | 'agents'
  | 'memory'

const settingItems: SidebarNavProps['items'] = [
  {
    key: 'general',
    title: 'General',
    icon: <IconUser size={18} />,
  },
  {
    key: 'personas',
    title: 'Personas',
    icon: <IconUser size={18} />,
  },
  {
    key: 'agents',
    title: 'Agents',
    icon: <IconUser size={18} />,
  },
  {
    key: 'memory',
    title: 'Memory',
    icon: <IconUser size={18} />,
  }
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
  selectKey: 'general',
  setSelectKey: (key) => set({ selectKey: key }),
  reset: () => set({ selectKey: 'general' }),
  setOpen(open) {
    set({ open });
  },
}));

export default useSettingsStore;
