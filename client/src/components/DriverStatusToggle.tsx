/**
 * DriverStatusToggle Component
 *
 * Toggle driver online/offline status.
 * Displays current state and loading indicator.
 */

import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { useDriverStatus } from '@/hooks/useDriverStatus';

export function DriverStatusToggle() {
  const { isOnline, setIsOnline, isLoading, error } = useDriverStatus();

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="flex-1">
        <h3 className="font-semibold">
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? 'Ready to accept rides'
            : 'Not currently accepting rides'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
        <Switch
          checked={isOnline}
          onCheckedChange={setIsOnline}
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive col-span-2">{error}</p>
      )}
    </div>
  );
}
