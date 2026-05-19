/**
 * PaymentCTA Component
 *
 * Shows payment request + secure payment button.
 * Gateway between rider acceptance and driver assignment.
 *
 * Props:
 * - amount: Amount to secure (USDC)
 * - onPay: Callback when pay button clicked
 * - isLoading: Show loading state during payment
 * - error: Error message from payment attempt
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AlertTriangle, Lock, Loader2 } from 'lucide-react';

interface PaymentCTAProps {
  amount: number;
  onPay: () => void;
  isLoading?: boolean;
  error?: string;
  statusLabel?: string;
  isWalletReady?: boolean;
}

export function PaymentCTA({
  amount,
  onPay,
  isLoading = false,
  error,
  statusLabel,
  isWalletReady = false,
}: PaymentCTAProps) {
  return (
    <Card className="p-8 bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border-neon-purple/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-neon-teal" />
          <h2 className="text-2xl font-bold">Secure Your Ride</h2>
        </div>

        {/* Amount */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <p className="text-sm text-muted-foreground mb-2">Amount to Hold</p>
          <p className="text-4xl font-bold text-neon-teal">${amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-3">
            USDC will be held in escrow. Released after trip completion.
          </p>
        </div>

        {/* Why description */}
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            ✓ Driver is matched and on the way  
            ✓ Payment secures your ride  
            ✓ You're protected by escrow
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {/* CTA Button */}
        {!isWalletReady && (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        )}

        <Button
          onClick={onPay}
          disabled={isLoading}
          size="lg"
          className="w-full bg-neon-teal hover:bg-neon-teal/90"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)} with USDC`}
        </Button>

        {statusLabel && (
          <p className="text-xs text-center text-muted-foreground">
            {statusLabel}
          </p>
        )}

        {/* Security note */}
        <p className="text-xs text-center text-muted-foreground">
          🔒 Your payment is secured by smart contract escrow
        </p>
      </div>
    </Card>
  );
}
