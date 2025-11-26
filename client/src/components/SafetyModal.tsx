import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Phone, MapPin, Users } from "lucide-react";

interface SafetyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SafetyModal({ open, onOpenChange }: SafetyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-neon-teal" />
            Your Safety is Our Priority
          </DialogTitle>
          <DialogDescription className="text-base">
            Libre is committed to keeping you safe on every ride. Here's what we do to protect you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {[
            {
              icon: Shield,
              title: "Verified Drivers",
              description: "All drivers undergo background checks, vehicle inspections, and identity verification.",
            },
            {
              icon: Phone,
              title: "24/7 SOS Support",
              description: "Tap the SOS button anytime to immediately alert emergency services and our safety team.",
            },
            {
              icon: MapPin,
              title: "GPS Tracking",
              description: "Every ride is tracked in real-time with GPS proof stored on the blockchain for your security.",
            },
            {
              icon: Users,
              title: "Share Your Trip",
              description: "Share your live location and trip details with trusted contacts for added peace of mind.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-teal to-neon-purple flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-safety-later">
            I'll Review Later
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-neon-teal hover:bg-neon-teal/90" data-testid="button-safety-got-it">
            Got It, Thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
