import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NFTBadgeCard } from "@/components/NFTBadgeCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, DollarSign, TrendingUp, Copy, Share2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Web3Connect } from "@/components/Web3Connect";
import { BADGE_TYPES } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [referralCode] = useState("LIBRE2025XYZ");

  const userProfile = {
    username: "JohnDoe",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    role: "driver",
    reputationScore: 4.9,
    totalRides: 247,
    totalEarnings: 12450.75,
    totalSpent: 0,
    lifeStats: {
      miles: 2847,
      carbonOffset: 1.2, // tons
      topRating: 5.0,
    },
    badges: [
      { id: "1", badgeType: BADGE_TYPES.RIDES_100, tokenId: "1001", earnedAt: "2025-01-15" },
      { id: "2", badgeType: BADGE_TYPES.FIVE_STAR, tokenId: "2001", earnedAt: "2025-02-01" },
      { id: "3", badgeType: BADGE_TYPES.AIRPORT_LICENSED, tokenId: "3001", earnedAt: "2025-01-20" },
    ],
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://libre.app/ref/${referralCode}`);
    toast({
      title: "Referral link copied!",
      description: "Share it with friends to earn $5 USDC each.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Libre",
        text: "Join me on Libre - Web3 ride-sharing!",
        url: `https://libre.app/ref/${referralCode}`,
      });
    } else {
      handleCopyReferral();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent" data-testid="link-home">
              Libre
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={userProfile.role === "driver" ? "/driver" : "/rider"}>
              <Button variant="ghost" size="sm" data-testid="button-dashboard">
                Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="border-accent text-accent" data-testid="button-connect-wallet">
              {userProfile.walletAddress.slice(0, 6)}...{userProfile.walletAddress.slice(-4)}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Card */}
        <Card className="bg-gradient-neon p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src="" />
              <AvatarFallback className="text-3xl bg-white text-primary">
                {userProfile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-username">{userProfile.username}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  {userProfile.role === "driver" ? "Driver" : "Rider"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-semibold" data-testid="text-reputation-score">{userProfile.reputationScore}</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold" data-testid="text-total-rides">{userProfile.totalRides}</p>
              <p className="text-sm text-white/80">Total Rides</p>
            </div>
          </div>
        </Card>

        {/* NFT Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Achievement Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userProfile.badges.map((badge) => (
              <NFTBadgeCard
                key={badge.id}
                badgeType={badge.badgeType}
                tokenId={badge.tokenId}
                earnedAt={badge.earnedAt}
              />
            ))}
            {/* Locked badge */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 border-dashed p-6 opacity-50" data-testid="card-badge-locked">
              <div className="flex flex-col items-center gap-4 h-full justify-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-3xl">🔒</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-muted-foreground">1,000 Rides</h3>
                  <p className="text-xs text-muted-foreground">753 to go</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Lifetime Stats */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
            <h2 className="text-xl font-bold mb-6">Lifetime Stats</h2>
            <div className="space-y-6">
              {[
                { icon: MapPin, label: "Miles Driven", value: userProfile.lifeStats.miles.toLocaleString(), color: "text-neon-pink" },
                { icon: DollarSign, label: "Total Earnings", value: `$${userProfile.totalEarnings.toLocaleString()}`, color: "text-neon-teal" },
                { icon: TrendingUp, label: "Carbon Offset", value: `${userProfile.lifeStats.carbonOffset} tons`, color: "text-green-500" },
                { icon: Star, label: "Top Rating", value: userProfile.lifeStats.topRating.toFixed(1), color: "text-yellow-500" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Referral */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 p-6">
            <h2 className="text-xl font-bold mb-6">Refer & Earn</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Share your referral link and earn <span className="text-neon-teal font-semibold">$5 USDC</span> for each friend who joins!
                They'll get $5 too.
              </p>
              
              <div className="relative">
                <Input
                  value={`https://libre.app/ref/${referralCode}`}
                  readOnly
                  className="pr-24 bg-muted/20"
                  data-testid="input-referral-link"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyReferral}
                    data-testid="button-copy-referral"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShare}
                    data-testid="button-share-referral"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 bg-neon-teal/10 rounded-lg border border-neon-teal/20">
                  <p className="text-2xl font-bold text-neon-teal" data-testid="text-referrals-sent">12</p>
                  <p className="text-xs text-muted-foreground">Referrals Sent</p>
                </div>
                <div className="text-center p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                  <p className="text-2xl font-bold text-neon-purple" data-testid="text-referrals-earned">$35.00</p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
