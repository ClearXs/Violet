import { SidebarData } from '@/components/layout/types';
import {
  IconBook2,
  IconBulbFilled,
} from '@tabler/icons-react';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Violet',
      logo: Command,
      plan: 'Personal Intelligence Hub',
    },
  ],
  navGroups: [
    {
      title: 'Apps',
      items: [
        {
          id: 'personas',
          title: 'Personas',
          url: '/personas',
          icon: IconBook2,
        },
        {
          id: 'agents',
          title: 'Agents',
          url: '/agents',
          icon: IconBulbFilled,
        },
        {
          id: 'memory',
          title: 'Memory',
          url: '/memory',
          icon: IconBulbFilled,
        },
      ],
    },
  ],
};
