import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { appSidebarData } from "@/data/app-sidebar-data";

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="h-25 flex-row items-center px-6 border-b border-sidebar-border">
        <a href="/">
          <img src="/logo.svg" alt="AutoMammo" className="cursor-pointer" />
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={appSidebarData.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={appSidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  );
};
