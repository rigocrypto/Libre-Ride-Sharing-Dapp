import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface SOSButtonProps {
  rideId?: string;
}

export function SOSButton({ rideId }: SOSButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleSOS = async () => {
    // In production, this would trigger emergency services and admin alerts
    toast({
      title: "SOS Alert Sent",
      description: "Emergency services and our safety team have been notified. Help is on the way.",
      variant: "destructive",
    });
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        onClick={() => setShowDialog(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 shadow-lg animate-pulse-glow"
        data-testid="button-sos"
      >
        <AlertTriangle className="w-8 h-8" />
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emergency SOS Alert</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately alert emergency services, our safety team, and your emergency contacts.
              Only use this if you're in immediate danger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-sos-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSOS}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-sos-confirm"
            >
              Send SOS Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
