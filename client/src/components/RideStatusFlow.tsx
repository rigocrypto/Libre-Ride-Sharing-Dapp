import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RideStatusFlowProps {
  currentStatus: "matching" | "en_route" | "arrived" | "on_trip" | "completed";
}

const STATUSES = [
  { id: "matching", label: "Matching", color: "text-muted-foreground" },
  { id: "en_route", label: "En Route", color: "text-accent" },
  { id: "arrived", label: "Arrived", color: "text-primary" },
  { id: "on_trip", label: "On Trip", color: "text-neon-purple" },
  { id: "completed", label: "Completed", color: "text-neon-teal" },
] as const;

export function RideStatusFlow({ currentStatus }: RideStatusFlowProps) {
  const currentIndex = STATUSES.findIndex((s) => s.id === currentStatus);

  return (
    <div className="w-full py-6" data-testid="status-ride-flow">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={status.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-gradient-neon border-transparent",
                    isCurrent && `${status.color} border-current bg-background`,
                    isUpcoming && "border-muted bg-background text-muted-foreground"
                  )}
                  data-testid={`status-step-${status.id}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isCurrent && status.color,
                    !isCurrent && "text-muted-foreground"
                  )}
                >
                  {status.label}
                </span>
              </div>
              {index < STATUSES.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-2 transition-all",
                  isCompleted ? "bg-gradient-neon" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
