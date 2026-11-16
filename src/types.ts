export interface LatLng {
  lat: number;
  lng: number;
  alt?: number | null;
  ts?: number | null;
}

export interface StreamSession {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  category: string;
  startedAt: number;
  viewers: number;
  speed: number;
  altitude: number;
  distance: number;
  lat: number;
  lng: number;
  heartRate?: number;
  lastFrame?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  recipientId?: string;
  recipientName?: string;
  isPrivate?: boolean;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  type: 'chat' | 'alert' | 'route_share' | 'system';
  timestamp: number;
  likes?: number;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  connectedAt: number;
  lastSeenAt: number;
  isOnline: boolean;
}

export interface GroupRide {
  id: string;
  code: string;
  title: string;
  creatorName: string;
  creatorId: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  meetingPoint: string;
  lat: number;
  lng: number;
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: number;
}

export interface CyclingEvent {
  id: string;
  title: string;
  category: 'Gran Fondo' | 'Kriteryum' | 'Gravel Yarışı' | 'Brevet' | 'Sosyal Tur';
  organizer: string;
  date: string;
  startTime: string;
  location: string;
  city: string;
  distanceKm: number;
  elevationM: number;
  registrationOpen: boolean;
  participantsCount: number;
  registeredUserIds: string[];
  description: string;
  lat: number;
  lng: number;
}

export interface ActiveRider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude: number;
  heartRate?: number;
  updatedAt: number;
}

export interface HrZoneDistribution {
  z1Sec: number;
  z2Sec: number;
  z3Sec: number;
  z4Sec: number;
  z5Sec: number;
}

export interface HeartRateZoneInfo {
  zone: number;
  name: string;
  minBpm: number;
  maxBpm: number;
  color: string;
  bgLight: string;
  description: string;
}

export interface HeartRateSensorState {
  isConnected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  currentBpm: number;
  avgBpm: number;
  maxBpm: number;
  isSimulated: boolean;
  sensorContact: boolean;
  maxHeartRateSetting: number;
}

export type RideSportType = 'road' | 'gravel' | 'mtb' | 'city' | 'ebike';

export interface RideLap {
  lapNumber: number;
  distanceKm: number;
  durationSec: number;
  avgSpeedKmH: number;
  timestamp: number;
}

export interface SavedRide {
  id: string;
  title: string;
  date: string;
  sportType?: RideSportType;
  effort?: number;
  notes?: string;
  movingTimeSec?: number;
  laps?: RideLap[];
  distanceKm: number;
  durationSec: number;
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  climbM: number;
  descentM: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  caloriesKcal?: number;
  jumpCount?: number;
  hrZones?: HrZoneDistribution;
  points: LatLng[];
  insights?: RideInsightsData;
}

export interface PowerZoneBreakdown {
  zone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  rangeWatts: string;
  rangePct: string;
  seconds: number;
  percent: number;
  color: string;
  adaptation: string;
}

export interface GearEfficiencyAnalysis {
  score: number; // 0 - 100
  optimalCadenceRange: string;
  estimatedAvgCadence: number;
  grindingPct: number; // < 75 RPM
  spinningPct: number; // > 100 RPM
  optimalPct: number;  // 80-95 RPM
  torqueStatus: 'Optimal Akıcı' | 'Yüksek Tork (Diz Yükü)' | 'Aşırı Yüksek Kadans';
  chainCrossWarning: boolean;
  recommendedGearing: string;
  summary: string;
}

export interface RideInsightsData {
  rideId: string;
  title: string;
  aiSummary: string;
  strengths: string[];
  improvements: string[];
  normalizedPower: number;
  intensityFactor: number;
  trainingStressScore: number;
  estimatedWattsPerKg: number;
  recoveryHours: number;
  nutritionAdvice: {
    carbsGrams: number;
    proteinGrams: number;
    hydrationLiters: number;
  };
  powerZones: PowerZoneBreakdown[];
  gearEfficiency: GearEfficiencyAnalysis;
  generatedAt: number;
  isSimulatedFallback?: boolean;
}

export interface RouteElevationPoint {
  distKm: number;
  elevM: number;
  gradientPct: number;
}

export interface RouteDifficultyAssessment {
  level: 'Kolay' | 'Orta' | 'Zor';
  score: number; // 0 - 100
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  label: string;
  breakdown: {
    gradientImpact: number;
    distanceImpact: number;
    surfaceMultiplier: number;
    surfaceDescription: string;
  };
  gearAndCadenceAdvice: string;
  summary: string;
}

export interface CyclingRoute {
  id: string;
  name: string;
  slug: string;
  category: 'Road' | 'Gravel' | 'MTB' | 'Coastal' | 'Climb';
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Epik';
  distanceKm: number;
  climbM: number;
  descentM: number;
  avgGradientPct: number;
  maxGradientPct: number;
  estimatedTimeMin: number;
  surface: string;
  tags: string[];
  rating: number;
  riderCount: number;
  recommendedWindDir: string;
  idealWindDeg: number; // degrees where wind gives best tailwind/shelter
  startPoint: LatLng;
  endPoint: LatLng;
  center: LatLng;
  description: string;
  waypoints: LatLng[];
  elevationProfile: RouteElevationPoint[];
  highlights: string[];
  calculatedDifficulty?: RouteDifficultyAssessment;
  distanceFromUserKm?: number;
  rampCount?: number;
  source?: 'google_maps' | 'openstreetmap' | 'catalog';
  googleMapsUri?: string;
}

export interface RouteCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isSystem?: boolean;
  routeIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TrailSpot {
  id: string;
  name: string;
  category: 'Gravel' | 'Road' | 'MTB' | 'Coastal' | 'Climb';
  distanceKm: number;
  climbM: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Epik';
  lat: number;
  lng: number;
  description: string;
  routeId?: string;
}

export type LeagueTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Champion'
  | 'Unreal';

export interface RankedDivision {
  tier: LeagueTier;
  division?: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  badgeBg: string;
  glowColor: string;
  borderColor: string;
  icon: string;
  rankTitle: string;
}

export interface LeaderboardRider {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  tier: LeagueTier;
  divisionName: string;
  points: number;
  totalDistanceKm: number;
  totalClimbM: number;
  ftpWatts: number;
  wattsPerKg: number;
  ridesCount: number;
  isOnline: boolean;
  isLive: boolean;
}

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  verified: boolean;
  providerId?: string;
  token?: string;
}

export interface RiderProfile {
  name: string;
  email?: string;
  avatar?: string;
  bio: string;
  level: number;
  ftpWatts: number;
  weightKg: number;
  googleUser?: GoogleUserProfile | null;
  bikes: { id: string; name: string; brand: string; type: string; mileageKm: number }[];
}

export type BadgeCategory = 'distance' | 'elevation' | 'time' | 'performance' | 'consistency';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'pro';
export type BadgeIconKey =
  | 'award'
  | 'compass'
  | 'sunrise'
  | 'moon'
  | 'mountain'
  | 'zap'
  | 'flame'
  | 'gauge'
  | 'calendar'
  | 'flag';

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconKey: BadgeIconKey;
  xpReward: number;
  targetValue: number;
  unit: string;
}

export interface PersistedUserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  triggerRideTitle: string;
  xpReward: number;
}

export interface EvaluatedBadge extends MilestoneBadge {
  unlocked: boolean;
  unlockedAt?: string;
  triggerRideTitle?: string;
  currentValue: number;
  progressPct: number;
}
