import { ArchivePage } from "@/pages/archive";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/archive")({
  component: () => <ArchivePage />,
});
