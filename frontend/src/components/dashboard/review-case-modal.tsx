import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { urgencyConfig } from "@/data/queue-config";
import { useQueue } from "@/hooks/use-queue";
import { cn } from "@/lib/utils";
import type { QueueItem } from "@/types/queue";
import {
  IconCheck,
  IconPhoto,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";

interface ReviewCaseModalProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReviewCaseModal = ({
  item,
  open,
  onOpenChange,
}: ReviewCaseModalProps) => {
  const { markComplete } = useQueue();

  if (!item) return null;

  const urgency =
    item.urgencyScore !== null ? urgencyConfig[item.urgencyLevel] : null;
  const widthPercent =
    item.urgencyScore !== null
      ? Math.round(((item.urgencyScore - -3) / (40 - -3)) * 100)
      : 0;
  const isComplete = item.status === "complete";

  const handleMarkComplete = () => {
    markComplete(item.patientId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-[75vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Case Review</DialogTitle>
          <DialogDescription>
            Review patient details, scan imagery, and the AI-generated report.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <IconUser className="size-4 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">
                  {item.patientName || item.patientId}
                </p>
                {item.patientName && (
                  <p className="text-xs text-muted-foreground">
                    {item.patientId}
                  </p>
                )}
              </div>
            </div>
            <span className="text-muted-foreground">
              <strong className="text-card-foreground">Sex:</strong> {item.sex}
            </span>
            <span className="text-muted-foreground">
              <strong className="text-card-foreground">Age:</strong> {item.age}y
            </span>
            <span className="text-muted-foreground">
              <strong className="text-card-foreground">Added:</strong>{" "}
              {item.timeAdded}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-card-foreground">
                Scan Image
              </h3>
              {item.imageUrl ? (
                <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border">
                  <img
                    src={item.imageUrl}
                    alt={`Scan for patient ${item.patientId}`}
                    className="w-full h-auto max-h-[50vh] object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <IconPhoto className="size-10 mb-2 opacity-40" />
                  <p className="text-sm">No scan image available</p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Urgency Assessment
                </h3>
                {item.urgencyScore !== null && urgency ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-3xl font-bold", urgency.text)}>
                        {item.urgencyScore.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / 40
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          urgency.bar,
                        )}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "inline-block text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md",
                        urgency.text,
                        urgency.bg,
                      )}
                    >
                      {item.urgencyLevel}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No urgency score assigned.
                  </p>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-3">
                  <IconSparkles className="size-4 text-primary" />
                  AI-Generated Report
                </h3>
                {item.report ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-card-foreground max-h-60 overflow-y-auto">
                    {item.report}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No AI report has been generated for this case yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isComplete && (
            <Button
              onClick={handleMarkComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <IconCheck className="size-4" />
              Mark as Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
