import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Car, Star, Plane } from "lucide-react";
import { BADGE_TYPES } from "@shared/schema";

interface NFTBadgeCardProps {
  badgeType: string;
  tokenId?: string;
  earnedAt?: string;
}

const BADGE_CONFIG = {
  [BADGE_TYPES.RIDES_100]: {
    icon: Car,
    label: "100 Rides",
    gradient: "from-neon-pink to-neon-purple",
    description: "Completed 100 rides",
  },
  [BADGE_TYPES.RIDES_1000]: {
    icon: Award,
    label: "1,000 Rides",
    gradient: "from-neon-purple to-neon-teal",
    description: "Completed 1,000 rides",
  },
  [BADGE_TYPES.FIVE_STAR]: {
    icon: Star,
    label: "5-Star Driver",
    gradient: "from-yellow-400 to-orange-500",
    description: "Perfect 5.0 rating",
  },
  [BADGE_TYPES.AIRPORT_LICENSED]: {
    icon: Plane,
    label: "Airport Licensed",
    gradient: "from-neon-teal to-blue-500",
    description: "MCO Airport certified",
  },
};

export function NFTBadgeCard({ badgeType, tokenId, earnedAt }: NFTBadgeCardProps) {
  const config = BADGE_CONFIG[badgeType as keyof typeof BADGE_CONFIG];
  
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6 hover-elevate" data-testid={`card-badge-${badgeType}`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">{config.label}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        {tokenId && (
          <Badge variant="outline" className="text-xs">
            NFT #{tokenId}
          </Badge>
        )}
        {earnedAt && (
          <p className="text-xs text-muted-foreground">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  );
}
