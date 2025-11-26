import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownWidget() {
  // Launch date: March 1, 2026
  const launchDate = new Date("2026-03-01T00:00:00").getTime();
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 md:p-8" data-testid="card-countdown">
      <p className="text-sm uppercase tracking-wide text-muted-foreground text-center mb-4">
        Orlando Launch In
      </p>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Min", value: timeLeft.minutes },
          { label: "Sec", value: timeLeft.seconds },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid={`text-countdown-${item.label.toLowerCase()}`}>
              {item.value.toString().padStart(2, "0")}
            </div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
