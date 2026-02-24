import { MainLayout } from "@/components/layout/main-layout";
import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <MainLayout />,
  notFoundComponent: () => <div>404 Not Found</div>,
});
