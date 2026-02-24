import { queueItems as initialQueueItems } from "@/data/mock-queue";
import type { QueueItem, UrgencyLevel } from "@/types/queue";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface QueueContextValue {
  queueItems: QueueItem[];
  addToQueue: (item: QueueItem) => void;
  markComplete: (patientId: string) => void;
}

const QueueContext = createContext<QueueContextValue | null>(null);

function getUrgencyLevel(score: number): UrgencyLevel {
  if (score >= 25) return "critical";
  if (score >= 16) return "high";
  if (score >= 7) return "medium";
  return "low";
}

function sortByUrgency(items: QueueItem[]): QueueItem[] {
  return [...items].sort((a, b) => {
    const scoreA = a.urgencyScore ?? -1;
    const scoreB = b.urgencyScore ?? -1;
    return scoreB - scoreA;
  });
}

function applyInProgressStatus(items: QueueItem[]): QueueItem[] {
  let assignedInProgress = false;

  return items.map((item) => {
    if (item.status === "complete") {
      return item;
    }

    if (!assignedInProgress) {
      assignedInProgress = true;
      return { ...item, status: "in-progress" as const };
    }

    if (item.status === "in-progress") {
      return { ...item, status: "pending" as const };
    }

    return item;
  });
}

function prepareQueue(items: QueueItem[]): QueueItem[] {
  return applyInProgressStatus(sortByUrgency(items));
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [rawQueueItems, setRawQueueItems] =
    useState<QueueItem[]>(initialQueueItems);

  const queueItems = useMemo(
    () => prepareQueue(rawQueueItems),
    [rawQueueItems],
  );

  const addToQueue = useCallback((item: QueueItem) => {
    setRawQueueItems((prev) => [...prev, item]);
  }, []);

  const markComplete = useCallback((patientId: string) => {
    setRawQueueItems((prev) =>
      prev.map((item) =>
        item.patientId === patientId
          ? { ...item, status: "complete" as const, urgencyScore: null }
          : item,
      ),
    );
  }, []);

  return (
    <QueueContext.Provider value={{ queueItems, addToQueue, markComplete }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue(): QueueContextValue {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}

export { getUrgencyLevel };
