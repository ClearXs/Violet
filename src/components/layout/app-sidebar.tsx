import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { NavGroup } from '@/components/layout/nav-group';
import { sidebarData } from '@/config/router';
import { TeamSwitcher } from './team-switcher';
import { Button } from '../ui/button';
import { IconSettings } from '@tabler/icons-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' variant='sidebar' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Button size='icon' className='w-full'>
          <IconSettings />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
