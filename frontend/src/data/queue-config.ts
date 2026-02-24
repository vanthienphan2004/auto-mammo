import type { QueueStatus } from "@/types/queue";

export const urgencyConfig: Record<
  string,
  { text: string; bg: string; bar: string }
> = {
  critical: {
    text: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    bar: "bg-red-500",
  },
  high: {
    text: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    bar: "bg-orange-500",
  },
  medium: {
    text: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    bar: "bg-yellow-500",
  },
  low: {
    text: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    bar: "bg-emerald-500",
  },
};

export const statusConfig: Record<
  QueueStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  "in-progress": {
    label: "In Progress",
    dot: "bg-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  complete: {
    label: "Complete",
    dot: "",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-300",
  },
};
