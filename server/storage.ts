import {
  type User,
  type InsertUser,
  type Driver,
  type InsertDriver,
  type Ride,
  type InsertRide,
  type Badge,
  type InsertBadge,
  type Waitlist,
  type InsertWaitlist,
  type SOSAlert,
  type InsertSOSAlert,
  type Dispute,
  type InsertDispute,
  type Referral,
  type InsertReferral,
  type RideWithDetails,
  type DriverProfile,
  type DriverCompliance,
  type VehicleCompliance,
  type InsuranceValidation,
  BADGE_TYPES,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Drivers
  getDriver(userId: string): Promise<Driver | undefined>;
  getDriverProfile(userId: string): Promise<DriverProfile | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(userId: string, updates: Partial<Driver>): Promise<Driver | undefined>;
  getOnlineDrivers(): Promise<DriverProfile[]>;

  // Rides
  getRide(id: string): Promise<RideWithDetails | undefined>;
  getRidesByUser(userId: string, role: "rider" | "driver"): Promise<RideWithDetails[]>;
  getAllRides(): Promise<RideWithDetails[]>;
  getActiveRides(): Promise<RideWithDetails[]>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined>;
  matchRide(rideId: string, driverId: string): Promise<Ride | undefined>;

  // Badges
  getBadgesByUser(userId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  checkAndAwardBadges(userId: string): Promise<Badge[]>;

  // Waitlist
  addToWaitlist(waitlist: InsertWaitlist): Promise<Waitlist>;
  getWaitlist(): Promise<Waitlist[]>;

  // SOS Alerts
  createSOSAlert(alert: InsertSOSAlert): Promise<SOSAlert>;
  getSOSAlerts(resolved?: boolean): Promise<SOSAlert[]>;
  resolveSOSAlert(id: string): Promise<SOSAlert | undefined>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputes(status?: string): Promise<Dispute[]>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;

  // Referrals
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralsByUser(userId: string): Promise<Referral[]>;
  claimReferral(code: string, userId: string): Promise<Referral | undefined>;

  // Photos & Documents (FL TNC Compliance)
  uploadDriverPhoto(photo: any): Promise<any>;
  getDriverPhotos(driverId: string): Promise<any[]>;
  uploadVehiclePhoto(photo: any): Promise<any>;
  getVehiclePhotos(driverId: string): Promise<any[]>;
  uploadInsuranceDocument(doc: any): Promise<any>;
  uploadBackgroundCheckDocument(doc: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private drivers: Map<string, Driver>;
  private rides: Map<string, Ride>;
  private badges: Map<string, Badge>;
  private waitlist: Map<string, Waitlist>;
  private sosAlerts: Map<string, SOSAlert>;
  private disputes: Map<string, Dispute>;
  private referrals: Map<string, Referral>;
  private driverCompliance: Map<string, DriverCompliance>;
  private vehicleCompliance: Map<string, VehicleCompliance>;
  private insuranceValidation: Map<string, InsuranceValidation>;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.rides = new Map();
    this.badges = new Map();
    this.waitlist = new Map();
    this.sosAlerts = new Map();
    this.disputes = new Map();
    this.referrals = new Map();
    this.driverCompliance = new Map();
    this.vehicleCompliance = new Map();
    this.insuranceValidation = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      walletAddress: insertUser.walletAddress || null,
      email: insertUser.email || null,
      username: insertUser.username || null,
      role: insertUser.role,
      phoneNumber: insertUser.phoneNumber || null,
      profileImage: insertUser.profileImage || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Drivers
  async getDriver(userId: string): Promise<Driver | undefined> {
    return Array.from(this.drivers.values()).find((d) => d.userId === userId);
  }

  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const user = await this.getUser(userId);
    const driver = await this.getDriver(userId);
    const badges = await this.getBadgesByUser(userId);

    if (!user || !driver) return undefined;

    return {
      ...user,
      driverDetails: driver,
      badges,
    };
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = {
      id,
      userId: insertDriver.userId,
      isOnline: insertDriver.isOnline ?? false,
      currentLocation: insertDriver.currentLocation || null,
      vehicleType: insertDriver.vehicleType || null,
      vehicleMake: insertDriver.vehicleMake || null,
      vehicleModel: insertDriver.vehicleModel || null,
      vehicleYear: insertDriver.vehicleYear || null,
      vehicleColor: insertDriver.vehicleColor || null,
      licensePlate: insertDriver.licensePlate || null,
      licenseNumber: insertDriver.licenseNumber || null,
      insuranceDoc: insertDriver.insuranceDoc || null,
      vehicleRegistration: insertDriver.vehicleRegistration || null,
      isVerified: insertDriver.isVerified ?? false,
      isAirportLicensed: insertDriver.isAirportLicensed ?? false,
      reputationScore: insertDriver.reputationScore ?? 5.0,
      totalRides: insertDriver.totalRides ?? 0,
      totalEarnings: insertDriver.totalEarnings ?? 0,
      acceptanceRate: insertDriver.acceptanceRate ?? 100,
      onTimeRate: insertDriver.onTimeRate ?? 100,
      weeklyEarnings: insertDriver.weeklyEarnings ?? 0,
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(userId: string, updates: Partial<Driver>): Promise<Driver | undefined> {
    const driver = await this.getDriver(userId);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(driver.id, updated);
    return updated;
  }

  async getOnlineDrivers(): Promise<DriverProfile[]> {
    const onlineDrivers = Array.from(this.drivers.values()).filter((d) => d.isOnline);
    const profiles: DriverProfile[] = [];

    for (const driver of onlineDrivers) {
      const profile = await this.getDriverProfile(driver.userId);
      if (profile) profiles.push(profile);
    }

    return profiles;
  }

  // Rides
  async getRide(id: string): Promise<RideWithDetails | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;

    const rider = await this.getUser(ride.riderId);
    let driverWithDetails;

    if (ride.driverId) {
      const driver = await this.getUser(ride.driverId);
      const driverData = await this.getDriver(ride.driverId);
      if (driver) {
        driverWithDetails = { ...driver, driverDetails: driverData };
      }
    }

    return {
      ...ride,
      rider,
      driver: driverWithDetails,
    };
  }

  async getRidesByUser(userId: string, role: "rider" | "driver"): Promise<RideWithDetails[]> {
    const rides = Array.from(this.rides.values()).filter((r) =>
      role === "rider" ? r.riderId === userId : r.driverId === userId
    );

    const ridesWithDetails: RideWithDetails[] = [];
    for (const ride of rides) {
      const detailed = await this.getRide(ride.id);
      if (detailed) ridesWithDetails.push(detailed);
    }

    return ridesWithDetails;
  }

  async getAllRides(): Promise<RideWithDetails[]> {
    const rides: RideWithDetails[] = [];
    for (const ride of Array.from(this.rides.values())) {
      const detailed = await this.getRide(ride.id);
      if (detailed) rides.push(detailed);
    }
    return rides;
  }

  async getActiveRides(): Promise<RideWithDetails[]> {
    const activeStatuses = ["matching", "en_route", "arrived", "on_trip"];
    const rides = Array.from(this.rides.values()).filter((r) => activeStatuses.includes(r.status));

    const ridesWithDetails: RideWithDetails[] = [];
    for (const ride of rides) {
      const detailed = await this.getRide(ride.id);
      if (detailed) ridesWithDetails.push(detailed);
    }

    return ridesWithDetails;
  }

  async createRide(insertRide: InsertRide): Promise<Ride> {
    const id = randomUUID();
    const ride: Ride = {
      id,
      riderId: insertRide.riderId,
      driverId: insertRide.driverId || null,
      status: insertRide.status,
      pickupLocation: insertRide.pickupLocation,
      dropoffLocation: insertRide.dropoffLocation,
      estimatedPrice: insertRide.estimatedPrice,
      finalPrice: insertRide.finalPrice || null,
      surgeMultiplier: insertRide.surgeMultiplier ?? 1.0,
      distance: insertRide.distance || null,
      duration: insertRide.duration || null,
      airportFee: insertRide.airportFee ?? 0,
      cashbackAmount: insertRide.cashbackAmount ?? 0,
      routeHash: insertRide.routeHash || null,
      gpsProofs: insertRide.gpsProofs || null,
      libreRewards: insertRide.libreRewards ?? 0,
      createdAt: new Date(),
      matchedAt: null,
      startedAt: null,
      completedAt: null,
    };
    this.rides.set(id, ride);
    return ride;
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;
    const updated = { ...ride, ...updates };
    this.rides.set(id, updated);
    return updated;
  }

  async matchRide(rideId: string, driverId: string): Promise<Ride | undefined> {
    return this.updateRide(rideId, {
      driverId,
      status: "en_route",
      matchedAt: new Date(),
    });
  }

  // Badges
  async getBadgesByUser(userId: string): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter((b) => b.userId === userId);
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = randomUUID();
    const badge: Badge = {
      id,
      userId: insertBadge.userId,
      badgeType: insertBadge.badgeType,
      tokenId: insertBadge.tokenId || null,
      earnedAt: new Date(),
    };
    this.badges.set(id, badge);
    return badge;
  }

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const newBadges: Badge[] = [];
    const existingBadges = await this.getBadgesByUser(userId);
    const existingTypes = new Set(existingBadges.map((b) => b.badgeType));

    // Check for driver
    const driver = await this.getDriver(userId);
    if (!driver) return [];

    // 100 rides badge
    if ((driver.totalRides || 0) >= 100 && !existingTypes.has(BADGE_TYPES.RIDES_100)) {
      const badge = await this.createBadge({
        userId,
        badgeType: BADGE_TYPES.RIDES_100,
        tokenId: `${1000 + this.badges.size}`,
      });
      newBadges.push(badge);
    }

    // 1000 rides badge
    if ((driver.totalRides || 0) >= 1000 && !existingTypes.has(BADGE_TYPES.RIDES_1000)) {
      const badge = await this.createBadge({
        userId,
        badgeType: BADGE_TYPES.RIDES_1000,
        tokenId: `${2000 + this.badges.size}`,
      });
      newBadges.push(badge);
    }

    // 5-star badge
    if ((driver.reputationScore || 0) >= 5.0 && !existingTypes.has(BADGE_TYPES.FIVE_STAR)) {
      const badge = await this.createBadge({
        userId,
        badgeType: BADGE_TYPES.FIVE_STAR,
        tokenId: `${3000 + this.badges.size}`,
      });
      newBadges.push(badge);
    }

    // Airport licensed badge
    if (driver.isAirportLicensed && !existingTypes.has(BADGE_TYPES.AIRPORT_LICENSED)) {
      const badge = await this.createBadge({
        userId,
        badgeType: BADGE_TYPES.AIRPORT_LICENSED,
        tokenId: `${4000 + this.badges.size}`,
      });
      newBadges.push(badge);
    }

    return newBadges;
  }

  // Waitlist
  async addToWaitlist(insertWaitlist: InsertWaitlist): Promise<Waitlist> {
    const id = randomUUID();
    const waitlist: Waitlist = {
      id,
      email: insertWaitlist.email,
      userType: insertWaitlist.userType || null,
      createdAt: new Date(),
    };
    this.waitlist.set(id, waitlist);
    return waitlist;
  }

  async getWaitlist(): Promise<Waitlist[]> {
    return Array.from(this.waitlist.values());
  }

  // SOS Alerts
  async createSOSAlert(insertAlert: InsertSOSAlert): Promise<SOSAlert> {
    const id = randomUUID();
    const alert: SOSAlert = {
      id,
      userId: insertAlert.userId,
      rideId: insertAlert.rideId,
      location: insertAlert.location,
      message: insertAlert.message || null,
      resolved: false,
      createdAt: new Date(),
    };
    this.sosAlerts.set(id, alert);
    return alert;
  }

  async getSOSAlerts(resolved?: boolean): Promise<SOSAlert[]> {
    const alerts = Array.from(this.sosAlerts.values());
    if (resolved === undefined) return alerts;
    return alerts.filter((a) => a.resolved === resolved);
  }

  async resolveSOSAlert(id: string): Promise<SOSAlert | undefined> {
    const alert = this.sosAlerts.get(id);
    if (!alert) return undefined;
    const updated = { ...alert, resolved: true };
    this.sosAlerts.set(id, updated);
    return updated;
  }

  // Disputes
  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const id = randomUUID();
    const dispute: Dispute = {
      id,
      rideId: insertDispute.rideId,
      reporterId: insertDispute.reporterId,
      reason: insertDispute.reason,
      description: insertDispute.description || null,
      status: insertDispute.status || "pending",
      resolution: insertDispute.resolution || null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.disputes.set(id, dispute);
    return dispute;
  }

  async getDisputes(status?: string): Promise<Dispute[]> {
    const disputes = Array.from(this.disputes.values());
    if (!status) return disputes;
    return disputes.filter((d) => d.status === status);
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    const dispute = this.disputes.get(id);
    if (!dispute) return undefined;
    const updated = { ...dispute, ...updates };
    if (updates.status === "resolved" && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }
    this.disputes.set(id, updated);
    return updated;
  }

  // Referrals
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      id,
      referrerId: insertReferral.referrerId,
      referredUserId: insertReferral.referredUserId || null,
      referralCode: insertReferral.referralCode,
      rewardAmount: insertReferral.rewardAmount ?? 5.0,
      claimed: insertReferral.claimed ?? false,
      createdAt: new Date(),
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    return Array.from(this.referrals.values()).find((r) => r.referralCode === code);
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter((r) => r.referrerId === userId);
  }

  async claimReferral(code: string, userId: string): Promise<Referral | undefined> {
    const referral = await this.getReferralByCode(code);
    if (!referral || referral.claimed) return undefined;

    const updated = { ...referral, referredUserId: userId, claimed: true };
    this.referrals.set(referral.id, updated);
    return updated;
  }

  // Photos & Documents (FL TNC Compliance)
  async uploadDriverPhoto(photo: any): Promise<any> {
    const id = randomUUID();
    const stored = { id, ...photo, uploadedAt: new Date(), createdAt: new Date() };
    // In production, store in S3/Supabase; for now store reference
    return stored;
  }

  async getDriverPhotos(driverId: string): Promise<any[]> {
    // In production, retrieve from S3/Supabase
    return [];
  }

  async uploadVehiclePhoto(photo: any): Promise<any> {
    const id = randomUUID();
    const stored = { id, ...photo, uploadedAt: new Date(), createdAt: new Date() };
    return stored;
  }

  async getVehiclePhotos(driverId: string): Promise<any[]> {
    return [];
  }

  async uploadInsuranceDocument(doc: any): Promise<any> {
    const id = randomUUID();
    const stored = { id, ...doc, uploadedAt: new Date(), createdAt: new Date() };
    return stored;
  }

  async uploadBackgroundCheckDocument(doc: any): Promise<any> {
    const id = randomUUID();
    const stored = { id, ...doc, uploadedAt: new Date(), createdAt: new Date() };
    return stored;
  }
}

export const storage = new MemStorage();
