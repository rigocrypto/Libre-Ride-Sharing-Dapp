/**
 * RideCompleteSummary Component
 *
 * Shows trip completion:
 * - Receipt (pickup, dropoff, fare, escrow release)
 * - Rating prompt
 * - Option to book again
 *
 * Props:
 * - ride: Completed ride data
 * - onRate: Callback for rating submission
 * - onBookAgain: Callback to create new ride
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Star, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface RideCompleteSummaryProps {
  ride: {
    id: string;
    pickupLocation: string;
    dropoffLocation: string;
    estimatedPrice: number;
    escrowAmount: number;
    estimatedDistance: number;
    estimatedDuration: number;
    driver?: {
      name: string;
      rating: number;
    };
  };
  onRate?: (rating: number, comment: string) => void;
  onBookAgain?: () => void;
}

export function RideCompleteSummary({
  ride,
  onRate,
  onBookAgain,
}: RideCompleteSummaryProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRate = () => {
    if (rating > 0) {
      onRate?.(rating, comment);
      setSubmitted(true);
    }
  };

  return (
    <Card className="p-8 bg-white/5 backdrop-blur-lg border-white/10">
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-neon-teal" />
          </div>
          <h2 className="text-2xl font-bold">Ride summary</h2>
          <p className="text-sm text-muted-foreground">Great ride with {ride.driver?.name}</p>
        </div>

        {/* Receipt */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4">
          <h3 className="font-semibold">Trip Details</h3>

          <div className="space-y-3">
            {/* Pickup */}
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-neon-teal flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm">{ride.pickupLocation}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Dropoff */}
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-neon-pink flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm">{ride.dropoffLocation}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-sm font-semibold">{ride.estimatedDistance.toFixed(1)} mi</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-semibold">{ride.estimatedDuration} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="text-xs font-mono">{ride.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-3">
          <h3 className="font-semibold">Fare Breakdown</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fare</span>
              <span>${ride.estimatedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Escrow Released</span>
              <span className="text-neon-teal">${ride.escrowAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">${ride.estimatedPrice.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            ✓ Escrow released from smart contract
          </p>
        </div>

        {/* Rating (if not submitted) */}
        {!submitted && (
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 space-y-4">
            <h3 className="font-semibold">How was your ride?</h3>

            {/* Stars */}
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-white/30'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Optional: Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 resize-none"
              rows={3}
            />

            {/* Submit button */}
            <Button
              onClick={handleRate}
              disabled={rating === 0}
              className="w-full"
            >
              Submit Rating
            </Button>
          </div>
        )}

        {/* Submitted message */}
        {submitted && (
          <div className="bg-neon-teal/10 border border-neon-teal/20 rounded-lg p-6 text-center">
            <p className="text-sm">
              ✓ Thank you for rating! Your feedback helps us improve.
            </p>
          </div>
        )}

        {/* Book again button */}
        <Button onClick={onBookAgain} variant="outline" className="w-full">
          Book Again
        </Button>
      </div>
    </Card>
  );
}
