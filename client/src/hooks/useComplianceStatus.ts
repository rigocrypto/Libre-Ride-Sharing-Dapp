import { useState, useEffect } from "react";

interface ComplianceStatus {
  profilePhoto: boolean;
  licenseFront: boolean;
  licenseBack: boolean;
  vehicleFront: boolean;
  vehicleSide: boolean;
  vehicleBack: boolean;
  licensePlate: boolean;
  insurance: boolean;
  backgroundCheck: boolean;
  allComplete: boolean;
}

export function useComplianceStatus(driverId: string) {
  const [status, setStatus] = useState<ComplianceStatus>({
    profilePhoto: false,
    licenseFront: false,
    licenseBack: false,
    vehicleFront: false,
    vehicleSide: false,
    vehicleBack: false,
    licensePlate: false,
    insurance: false,
    backgroundCheck: false,
    allComplete: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [photos, vehicle] = await Promise.all([
          fetch(`/api/driver/${driverId}/photos`).then((r) => r.json()),
          fetch(`/api/vehicle/${driverId}/photos`).then((r) => r.json()),
        ]);

        const photoMap = new Map<string, boolean>(photos.map((p: any) => [String(p.photoType), p.verificationStatus === "verified"]));
        const vehicleMap = new Map<string, boolean>(vehicle.map((p: any) => [String(p.photoType), p.verificationStatus === "verified"]));

        const newStatus: ComplianceStatus = {
          profilePhoto: !!photoMap.get("profile"),
          licenseFront: !!photoMap.get("license_front"),
          licenseBack: !!photoMap.get("license_back"),
          vehicleFront: !!vehicleMap.get("front"),
          vehicleSide: !!vehicleMap.get("side"),
          vehicleBack: !!vehicleMap.get("back"),
          licensePlate: !!vehicleMap.get("license_plate"),
          insurance: false,
          backgroundCheck: false,
          allComplete: false,
        };

        newStatus.allComplete = Object.entries(newStatus)
          .filter(([key]) => key !== "allComplete")
          .every(([_, value]) => value);

        setStatus(newStatus);
      } catch (error) {
        console.error("Failed to fetch compliance status", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [driverId]);

  return { status, isLoading };
}
