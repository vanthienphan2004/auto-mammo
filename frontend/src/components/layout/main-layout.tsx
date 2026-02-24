import { AppSidebar } from "@/components/shared/app-sidebar";
import { TopHeader } from "@/components/shared/top-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "@tanstack/react-router";

export const MainLayout = () => {
  return (
    <SidebarProvider className="h-screen min-h-0!">
      <AppSidebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
};
