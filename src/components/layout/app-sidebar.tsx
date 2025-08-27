import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { NavGroup } from '@/components/layout/nav-group';
import { sidebarData } from '@/config/router';
import { TeamSwitcher } from './team-switcher';
import React from 'react';

type ExtendSidebarProps = {
  footer?: React.ReactNode;
};

export function AppSidebar({
  footer,
  ...props
}: ExtendSidebarProps & React.ComponentProps<typeof Sidebar>) {
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
      <SidebarFooter>{footer && footer}</SidebarFooter>
    </Sidebar>
  );
}
