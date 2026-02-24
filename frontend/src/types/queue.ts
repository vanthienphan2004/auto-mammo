export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export type QueueStatus = "in-progress" | "pending" | "complete";

export interface QueueItem {
  patientId: string;
  patientName?: string;
  sex: string;
  age: number;
  urgencyScore: number | null;
  urgencyLevel: UrgencyLevel;
  status: QueueStatus;
  timeAdded: string;
  imageUrl?: string;
  report?: string;
}

export interface StatCardData {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}
