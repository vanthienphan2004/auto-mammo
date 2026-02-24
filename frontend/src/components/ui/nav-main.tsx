import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type Icon } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";

interface NavMainProps {
  title: string;
  url: string;
  icon?: Icon;
}

export const NavMain = ({ items }: { items: NavMainProps[] }) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "rounded-lg px-3 py-5 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary",
                  )}
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon className="size-5" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
