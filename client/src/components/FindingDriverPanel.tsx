/**
 * FindingDriverPanel Component
 *
 * Shows animated "searching for driver" state.
 * No actions required from rider.
 *
 * Props: None (pure presentation)
 */

import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export function FindingDriverPanel() {
  return (
    <Card className="p-8 bg-white/5 backdrop-blur-lg border-white/10">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-neon-teal" />
          <h2 className="text-xl font-semibold mb-2">Finding a Driver</h2>
          <p className="text-sm text-muted-foreground">
            We're searching for an available driver near you...
          </p>
        </div>

        {/* Pulse animation */}
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-neon-teal animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-neon-teal animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-neon-teal animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </Card>
  );
}
