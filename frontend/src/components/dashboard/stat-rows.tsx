import { StatCard } from "@/components/dashboard/stat-card";
import { useQueue } from "@/hooks/use-queue";
import {
  IconCircleCheck,
  IconClock,
  IconListDetails,
} from "@tabler/icons-react";

export const StatsRow = () => {
  const { queueItems } = useQueue();

  const pendingCount = queueItems.filter(
    (item) => item.status !== "complete",
  ).length;

  const completedCount = queueItems.filter(
    (item) => item.status === "complete",
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        label="Queue Count"
        value={String(pendingCount)}
        unit="Pending"
        icon={IconListDetails}
        iconBg="bg-blue-50 dark:bg-blue-900/20"
        iconColor="text-primary"
      />
      <StatCard
        label="Completed Today"
        value={String(completedCount)}
        unit="Reports"
        icon={IconCircleCheck}
        iconBg="bg-green-50 dark:bg-green-900/20"
        iconColor="text-green-600"
      />
      <StatCard
        label="Avg. Processing Time"
        value="14m"
        unit="per scan"
        icon={IconClock}
        iconBg="bg-purple-50 dark:bg-purple-900/20"
        iconColor="text-purple-600"
      />
    </div>
  );
};
