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
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Apps',
      items: [
        {
          id: 'persona',
          title: 'Persona',
          url: '/persona',
          icon: IconBook2,
        },
        {
          id: 'agents',
          title: 'Agents',
          url: '/agent',
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
