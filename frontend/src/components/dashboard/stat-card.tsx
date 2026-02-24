import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

export const StatCard = ({
  label,
  value,
  unit,
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="text-3xl font-bold text-card-foreground mt-2">
          {value}{" "}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </h3>
      </div>
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          iconBg,
        )}
      >
        <Icon className={cn("size-5", iconColor)} />
      </div>
    </div>
  );
};
