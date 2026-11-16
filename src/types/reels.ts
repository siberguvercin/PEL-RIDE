export interface CyclingReel {
  id: string;
  mediaType?: 'video' | 'image';
  videoUrl?: string;
  photoUrl?: string;
  posterUrl: string;
  riderName: string;
  riderAvatar?: string;
  riderHandle: string;
  isVerified?: boolean;
  caption: string;
  tags: string[];
  location?: string;
  songTitle?: string;
  audioUrl?: string;
  audioSourceType?: 'spotify' | 'custom_voice' | 'custom_upload' | 'preset';
  customVoiceTitle?: string;
  spotifyTrackId?: string;
  spotifyUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  telemetry?: {
    speedKmH: number;
    watts: number;
    gradientPct: number;
    heartRateBpm: number;
    cadenceRpm?: number;
    distanceKm?: number;
  };
  durationSec: number;
  date: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isMyReel?: boolean;
  viewsCount?: number;
}

export interface RiderReelProfile {
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  followersCount: number;
  followingCount: number;
  reelsCount: number;
  isFollowing?: boolean;
  totalDistanceKm?: number;
}

export interface ReelComment {
  id: string;
  reelId: string;
  userName: string;
  userHandle?: string;
  userAvatar?: string;
  badge?: string;
  isAuthor?: boolean;
  text: string;
  timestamp: number;
  likesCount: number;
  isLiked?: boolean;
}
