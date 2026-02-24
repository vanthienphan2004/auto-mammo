import { MammographyQueue } from "@/components/dashboard/mammography-queue";
import { StatsRow } from "@/components/dashboard/stat-rows";

export const HomePage = () => {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 lg:p-8 gap-6 bg-background">
      <StatsRow />
      <MammographyQueue />
    </div>
  );
};
