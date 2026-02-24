import { ReviewCaseModal } from "@/components/dashboard/review-case-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusConfig, urgencyConfig } from "@/data/queue-config";
import { useQueue } from "@/hooks/use-queue";
import { cn } from "@/lib/utils";
import type { QueueItem, QueueStatus } from "@/types/queue";
import {
  IconArrowDown,
  IconFilter,
  IconSearch,
  IconUser,
} from "@tabler/icons-react";
import { useState } from "react";

const PAGE_SIZE = 6;

function getActionLabel(status: QueueStatus) {
  switch (status) {
    case "pending":
      return "Review Case";
    case "in-progress":
      return "Continue";
    case "complete":
      return "Archived";
  }
}

function UrgencyCell({ item }: { item: QueueItem }) {
  if (item.urgencyScore === null) {
    return (
      <span className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
        --
      </span>
    );
  }
  const config = urgencyConfig[item.urgencyLevel];
  const min = -3;
  const max = 40;
  const widthPercent = Math.round(
    ((item.urgencyScore - min) / (max - min)) * 100,
  );

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-sm font-bold px-2.5 py-1 rounded-md",
          config.text,
          config.bg,
        )}
      >
        {item.urgencyScore.toFixed(1)}
      </span>
      <div className="flex-1 w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full", config.bar)}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text,
      )}
    >
      {status === "complete" ? (
        <svg
          className="size-3.5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", config.dot)} />
      )}
      {config.label}
    </span>
  );
}

export const MammographyQueue = () => {
  const { queueItems } = useQueue();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

  const filtered = queueItems.filter((item) =>
    item.patientId.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "complete" && b.status !== "complete") return 1;
    if (a.status !== "complete" && b.status === "complete") return -1;

    if (a.urgencyScore === null && b.urgencyScore === null) return 0;
    if (a.urgencyScore === null) return 1;
    if (b.urgencyScore === null) return -1;

    return b.urgencyScore - a.urgencyScore;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const startIndex = safePage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sorted.length);
  const pageItems = sorted.slice(startIndex, endIndex);

  const emptyRowCount = PAGE_SIZE - pageItems.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="shrink-0 p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Mammography Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-prioritized worklist based on urgency score.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              className="pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border-none w-full sm:w-64"
              placeholder="Search patient ID..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <IconFilter className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto">
        <table className="w-full h-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="px-6 py-4">Patient ID</th>
              <th className="px-6 py-4">
                <div className="flex items-center gap-1 cursor-pointer group">
                  Urgency Score
                  <IconArrowDown className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time Added</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.map((item) => (
              <tr
                key={item.patientId}
                className={cn(
                  "group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                  item.status === "complete" && "opacity-60 hover:opacity-100",
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <IconUser className="size-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">
                        {item.patientId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.sex}, {item.age}y
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <UrgencyCell item={item} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {item.timeAdded}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className={cn(
                      "font-medium text-sm",
                      item.status === "complete"
                        ? "text-muted-foreground hover:text-slate-600"
                        : "text-primary hover:text-blue-700",
                    )}
                    onClick={
                      item.status !== "complete"
                        ? () => setSelectedItem(item)
                        : undefined
                    }
                  >
                    {getActionLabel(item.status)}
                  </button>
                </td>
              </tr>
            ))}
            {Array.from({ length: emptyRowCount }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10" />
                  </div>
                </td>
                <td className="px-6 py-4" />
                <td className="px-6 py-4" />
                <td className="px-6 py-4" />
                <td className="px-6 py-4" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-card-foreground">
            {filtered.length === 0 ? 0 : startIndex + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-card-foreground">{endIndex}</span>{" "}
          of{" "}
          <span className="font-medium text-card-foreground">
            {filtered.length}
          </span>{" "}
          results
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <ReviewCaseModal
        item={selectedItem}
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />
    </div>
  );
};
