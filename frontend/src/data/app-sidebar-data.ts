import { IconDashboard, IconFolder } from "@tabler/icons-react";

export const appSidebarData = {
  user: {
    name: "Dr. James Wilson",
    role: "Senior Radiologist",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHZhPMa_MHfcxexrFNnFv7EVeDac4c3gpuzLKbW6hKVUOpuOgF5vZGg7mzGcZsiZacG88JlZUPizsV7ViI40uqGTOVm84m2h5qlzHHbt4X1201SxQYLUS0IYvAVOXFdlx1X0Mod8n9O5I6XfyNpeMWbNMtX3UY1Fpauas72ziSBfTqz4anEaYGsjDPD6GdTt-l08qKBLn9odNqORZpv_wgqBbLDIm3cUryozbWpTk6WFA5d5dWOEO6JvwcFqP8TpF2MUMIkRYDiNI",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Patient Archive",
      url: "/archive",
      icon: IconFolder,
    },
  ],
};
