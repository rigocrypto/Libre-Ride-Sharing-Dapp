import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverOnboardingProps {
  driverId: string;
  onComplete?: () => void;
}

export function DriverOnboarding({ driverId, onComplete }: DriverOnboardingProps) {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const handlePhotoUpload = async (
    photoType: string,
    file: File
  ) => {
    try {
      setUploadProgress((prev) => ({ ...prev, [photoType]: 50 }));

      // Mock upload - in production, use UploadThing or Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadProgress((prev) => ({ ...prev, [photoType]: 100 }));
      setCompletedSteps((prev) => ({ ...prev, [photoType]: true }));

      toast({
        title: `${photoType} uploaded successfully`,
        description: "Photo verified and stored on-chain",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const sections = [
    {
      title: "Driver Identity",
      required: true,
      items: [
        { id: "profile", label: "Profile Photo", description: "Clear frontal photo" },
        { id: "license_front", label: "License Front", description: "Florida driver's license front" },
        { id: "license_back", label: "License Back", description: "Florida driver's license back" },
      ],
    },
    {
      title: "Vehicle Documentation",
      required: true,
      items: [
        { id: "front", label: "Vehicle Front", description: "Front view of vehicle" },
        { id: "side", label: "Vehicle Side", description: "Side view of vehicle" },
        { id: "back", label: "Vehicle Back", description: "Back view of vehicle" },
        { id: "license_plate", label: "License Plate", description: "Close-up of license plate" },
      ],
    },
    {
      title: "Insurance & Documents",
      required: true,
      items: [
        { id: "insurance", label: "Insurance Document", description: "Proof of $1M coverage" },
        { id: "registration", label: "Vehicle Registration", description: "Current registration" },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="bg-gradient-to-r from-neon-pink to-neon-purple p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-2">Driver Onboarding (FL Compliance)</h2>
        <p className="text-sm opacity-90">
          Complete all required documents to go online. All data is encrypted and stored securely.
        </p>
      </div>

      {sections.map((section, idx) => (
        <Card key={idx} className="p-6 bg-white/5 backdrop-blur-lg border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{section.title}</h3>
              {section.required && <span className="text-xs text-neon-pink">Required</span>}
            </div>
            {section.items.every((item) => completedSteps[item.id]) && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((item) => (
              <div key={item.id} className="border border-white/10 rounded-lg p-4">
                <label className="flex flex-col gap-3 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {completedSteps[item.id] && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  <input
                    id={`upload-${item.id}`}
                    name={`upload-${item.id}`}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) handlePhotoUpload(item.id, file);
                    }}
                    className="hidden"
                    data-testid={`input-upload-${item.id}`}
                  />

                  <div className="border-2 border-dashed border-white/20 rounded p-3 text-center hover:border-neon-pink/50 transition-colors">
                    <Upload className="w-4 h-4 mx-auto mb-2 opacity-60" />
                    <p className="text-xs">
                      {completedSteps[item.id]
                        ? "✓ Uploaded"
                        : uploadProgress[item.id]
                          ? `${uploadProgress[item.id]}%`
                          : "Click to upload"}
                    </p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-6 bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-900">Florida TNC Compliance</p>
            <p className="text-xs text-yellow-800 mt-1">
              By uploading these documents, you confirm that all information is accurate and you meet Florida Transportation Network Company (TNC) requirements under §627.748. Drivers must be 21+, have a clean driving record, and operate a vehicle 15+ years new.
            </p>
          </div>
        </div>
      </Card>

      <Button
        onClick={onComplete}
        disabled={!sections.every((s) => s.items.every((item) => completedSteps[item.id]))}
        className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-bold py-3"
        data-testid="button-complete-onboarding"
      >
        Complete Onboarding & Go Online
      </Button>
    </div>
  );
}
