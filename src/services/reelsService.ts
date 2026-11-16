import { CyclingReel, ReelComment, RiderReelProfile } from '../types/reels';

const REELS_STORAGE_KEY = 'pel_cycling_reels_v4';
const FOLLOWED_STORAGE_KEY = 'pel_followed_riders_v1';
const COMMENTS_STORAGE_KEY = 'pel_reels_comments_v2';

export const SEED_REELS: CyclingReel[] = [
  {
    id: 'reel-original-voice',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-on-a-bicycle-during-a-competition-41482-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    riderName: 'Caner Pedal',
    riderHandle: '@caner_climber',
    riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    caption: 'Kendi sesimle tırmanış anlatımı! %12 dik eğimde nefes nefese son 500 metre 🎙️🚴‍♂️ "Bacaklar yanıyor ama zirve göründü, pes etmek yok!"',
    tags: ['#orijinalses', '#voiceReel', '#cyclingvoice', '#climb'],
    location: 'Kartepe Zirve Yolu',
    songTitle: 'Orijinal Ses - Caner Pedal (Tırmanış Anlatımı)',
    audioSourceType: 'custom_voice',
    customVoiceTitle: 'Orijinal Ses - Caner Pedal',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    likesCount: 1980,
    commentsCount: 142,
    sharesCount: 280,
    viewsCount: 14200,
    telemetry: {
      speedKmH: 14.5,
      watts: 380,
      gradientPct: 11.8,
      heartRateBpm: 178,
      cadenceRpm: 74,
      distanceKm: 22.4
    },
    durationSec: 15,
    date: '4 saat önce',
    isLiked: false,
    isSaved: false,
    isMyReel: false
  },
  {
    id: 'reel-tame-impala',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-along-the-highway-41484-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    riderName: 'Aero Pelotoni',
    riderHandle: '@aero_cyclist',
    riderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    caption: 'Alp virajlarında 72 km/s iniş hissi bambaşka! 🏔️ Tame Impala ritmiyle apex çizgilerini tutturmak saf keyif. Sizce en akıcı iniş neresi?',
    tags: ['#cycling', '#peloton', '#descent', '#roadcycling', '#tameimpala', '#spotify'],
    location: 'Stelvio Geçidi, Alpler',
    songTitle: 'Tame Impala - The Less I Know The Better',
    audioSourceType: 'spotify',
    spotifyTrackId: '2XWjPtKdi2oSC95gCOOJyv',
    spotifyUrl: 'https://open.spotify.com/track/2XWjPtKdi2oSC95gCOOJyv',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    likesCount: 3420,
    commentsCount: 168,
    sharesCount: 412,
    viewsCount: 28900,
    telemetry: {
      speedKmH: 72.4,
      watts: 310,
      gradientPct: -8.5,
      heartRateBpm: 164,
      cadenceRpm: 104,
      distanceKm: 42.6
    },
    durationSec: 15,
    date: 'Bugün',
    isLiked: false,
    isSaved: false,
    isMyReel: false
  },
  {
    id: 'reel-beck-loser',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-competing-in-a-race-41483-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    riderName: 'Peloton Pro Team',
    riderHandle: '@peloton_pro',
    riderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    caption: 'Peloton sprint finişi! Son 200 metrede 1240W pik güç patlaması. Beck - Loser ritmiyle son çizgiye uçuş ⚡🔥',
    tags: ['#sprint', '#pelotonracing', '#wattagebazooka', '#critlife', '#beckloser', '#spotify'],
    location: 'Caddebostan Kriteryumu',
    songTitle: 'Beck - Loser',
    audioSourceType: 'spotify',
    spotifyTrackId: '7D0r6v1Csp0Vz4v7iTq11l',
    spotifyUrl: 'https://open.spotify.com/track/7D0r6v1Csp0Vz4v7iTq11l',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-energetic-hip-hop-834.mp3',
    likesCount: 4920,
    commentsCount: 278,
    sharesCount: 610,
    viewsCount: 41500,
    telemetry: {
      speedKmH: 64.2,
      watts: 1180,
      gradientPct: 0.5,
      heartRateBpm: 186,
      cadenceRpm: 122,
      distanceKm: 58.0
    },
    durationSec: 18,
    date: 'Dün',
    isLiked: true,
    isSaved: true,
    isMyReel: false
  },
  {
    id: 'reel-sunset-photo',
    mediaType: 'image',
    photoUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80',
    riderName: 'Ece Aydın',
    riderHandle: '@ece_climbs',
    riderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    isVerified: true,
    caption: 'Günün batımı, 110 km sonrası Çamlıca finişi. Tame Impala melodisiyle anın tadını çıkarmak paha biçilemez 🌅🚴‍♀️',
    tags: ['#sunsetride', '#cyclistlife', '#istanbulcycling', '#photoReel', '#tameimpala', '#spotify'],
    location: 'Büyük Çamlıca Tepesi, İstanbul',
    songTitle: 'Tame Impala - Let It Happen',
    audioSourceType: 'spotify',
    spotifyTrackId: '6XCOB0d8a9F0C0f5pZc4A1',
    spotifyUrl: 'https://open.spotify.com/track/6XCOB0d8a9F0C0f5pZc4A1',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
    likesCount: 2840,
    commentsCount: 112,
    sharesCount: 345,
    viewsCount: 19800,
    telemetry: {
      speedKmH: 26.4,
      watts: 240,
      gradientPct: 7.2,
      heartRateBpm: 152,
      cadenceRpm: 88,
      distanceKm: 110.4
    },
    durationSec: 15,
    date: '1 gün önce',
    isLiked: false,
    isSaved: false,
    isMyReel: false
  }
];

export const INITIAL_COMMENTS_MAP: Record<string, ReelComment[]> = {
  'reel-original-voice': [
    {
      id: 'c-ov-1',
      reelId: 'reel-original-voice',
      userName: 'Mert Kaynar',
      userHandle: 'mert_climber',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      badge: 'Tırmanışçı',
      isAuthor: false,
      text: 'O %12 eğimde ses kaydı alabilmek bile ciğer ister abi! 🎙️ Zirve finişi efsane olmuş 🔥',
      timestamp: Date.now() - 1000 * 60 * 25,
      likesCount: 34,
      isLiked: true
    },
    {
      id: 'c-ov-2',
      reelId: 'reel-original-voice',
      userName: 'Caner Pedal',
      userHandle: 'caner_climber',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      badge: 'Yazar',
      isAuthor: true,
      text: 'Eyvallah dostum! Aynakolu 34-32 kurtardı, yoksa son 300 metrede yürütürdü valla 🚴‍♂️💪',
      timestamp: Date.now() - 1000 * 60 * 15,
      likesCount: 19,
      isLiked: false
    },
    {
      id: 'c-ov-3',
      reelId: 'reel-original-voice',
      userName: 'Selin Demir',
      userHandle: 'selin_peloton',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      badge: 'Peloton',
      isAuthor: false,
      text: 'Kendi sesinle anlatman videoyu çok samimi yapmış, devamını bekliyoruz 👏',
      timestamp: Date.now() - 1000 * 60 * 5,
      likesCount: 8,
      isLiked: false
    }
  ],
  'reel-tame-impala': [
    {
      id: 'c1',
      reelId: 'reel-tame-impala',
      userName: 'Aero Burak',
      userHandle: 'burak_aero',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      badge: 'Aero Uzmanı',
      isAuthor: false,
      text: 'Tame Impala ritmiyle o virajda çizgiyi ne güzel kestin abi! Kadans ve apeks çizgisi mükemmel 👏',
      timestamp: Date.now() - 3600000,
      likesCount: 42,
      isLiked: true
    },
    {
      id: 'c2',
      reelId: 'reel-tame-impala',
      userName: 'Mert Sprint',
      userHandle: 'mert_sprint',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      badge: 'Kriter',
      isAuthor: false,
      text: '50mm karbon jantlarla yan rüzgar savurmadı mı? Viraj çıkışında 72 km/s muazzam!',
      timestamp: Date.now() - 7200000,
      likesCount: 18,
      isLiked: false
    },
    {
      id: 'c-ti-3',
      reelId: 'reel-tame-impala',
      userName: 'Aero Pelotoni',
      userHandle: 'aero_cyclist',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      badge: 'Yazar',
      isAuthor: true,
      text: 'Lastikler 28mm tubeless 65 psi, yol tutuşu ray gibi hissettiriyor virajda 😉',
      timestamp: Date.now() - 1800000,
      likesCount: 25,
      isLiked: false
    }
  ],
  'reel-my-first-clip': [
    {
      id: 'c-m1',
      reelId: 'reel-my-first-clip',
      userName: 'Caner Pedal',
      userHandle: 'caner_climber',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      badge: 'Tırmanışçı',
      isAuthor: false,
      text: 'Sahil yolu kadansın çok diri görünüyor! Hafta sonu tırmanış grubuna bekleriz 🚴‍♂️',
      timestamp: Date.now() - 1000 * 60 * 120,
      likesCount: 14,
      isLiked: true
    }
  ]
};

class ReelsService {
  private reels: CyclingReel[] = [];
  private comments: Record<string, ReelComment[]> = {};
  private followedHandles: Set<string> = new Set();
  private listeners: Set<(reels: CyclingReel[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedReels = localStorage.getItem(REELS_STORAGE_KEY);
      if (storedReels !== null) {
        const parsed = JSON.parse(storedReels);
        if (Array.isArray(parsed)) {
          this.reels = parsed;
        } else {
          this.reels = [...SEED_REELS];
        }
      } else {
        this.reels = [...SEED_REELS];
      }

      const storedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (storedComments) {
        this.comments = JSON.parse(storedComments);
      } else {
        this.comments = { ...INITIAL_COMMENTS_MAP };
      }

      const storedFollows = localStorage.getItem(FOLLOWED_STORAGE_KEY);
      if (storedFollows) {
        this.followedHandles = new Set(JSON.parse(storedFollows));
      } else {
        this.followedHandles = new Set(['@caner_climber']);
      }
    } catch (e) {
      this.reels = [...SEED_REELS];
      this.comments = { ...INITIAL_COMMENTS_MAP };
      this.followedHandles = new Set();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(this.reels));
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(this.comments));
      localStorage.setItem(FOLLOWED_STORAGE_KEY, JSON.stringify(Array.from(this.followedHandles)));
    } catch (e) {
      // Retry by trimming oldest items if image data URLs exceed storage quota
      try {
        const trimmed = this.reels.slice(0, 12);
        localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(trimmed));
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(this.comments));
        localStorage.setItem(FOLLOWED_STORAGE_KEY, JSON.stringify(Array.from(this.followedHandles)));
      } catch (retryErr) {
        console.warn('Failed to save reels storage:', retryErr || e);
      }
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.reels]);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public subscribe(listener: (reels: CyclingReel[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.reels]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getReels(): CyclingReel[] {
    return [...this.reels];
  }

  public getMyReels(userName?: string): CyclingReel[] {
    const cleanUser = (userName || '').toLowerCase().trim();
    return this.reels.filter((r) => {
      if (r.isMyReel) return true;
      if (cleanUser && r.riderName.toLowerCase().trim() === cleanUser) return true;
      return false;
    });
  }

  public getRiderReels(handleOrName: string): CyclingReel[] {
    const clean = handleOrName.toLowerCase().replace('@', '').trim();
    return this.reels.filter((r) => {
      const rHandle = (r.riderHandle || '').toLowerCase().replace('@', '').trim();
      const rName = (r.riderName || '').toLowerCase().trim();
      return rHandle === clean || rName === clean;
    });
  }

  public addReel(newReel: CyclingReel) {
    this.reels = [newReel, ...this.reels];
    this.saveToStorage();
    this.notify();
  }

  public deleteReel(reelId: string): boolean {
    const exists = this.reels.some((r) => r.id === reelId);
    if (!exists) return false;
    this.reels = this.reels.filter((r) => r.id !== reelId);
    if (this.comments[reelId]) {
      delete this.comments[reelId];
    }
    this.saveToStorage();
    this.notify();
    return true;
  }

  public toggleLike(reelId: string): CyclingReel | null {
    let updated: CyclingReel | null = null;
    this.reels = this.reels.map((r) => {
      if (r.id === reelId) {
        const nextLiked = !r.isLiked;
        updated = {
          ...r,
          isLiked: nextLiked,
          likesCount: nextLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1)
        };
        return updated;
      }
      return r;
    });
    this.saveToStorage();
    this.notify();
    return updated;
  }

  public incrementViews(reelId: string) {
    this.reels = this.reels.map((r) => {
      if (r.id === reelId) {
        return {
          ...r,
          viewsCount: (r.viewsCount || 0) + 1
        };
      }
      return r;
    });
    this.saveToStorage();
  }

  public getComments(reelId: string): ReelComment[] {
    return this.comments[reelId] || [];
  }

  public getAllCommentsMap(): Record<string, ReelComment[]> {
    return { ...this.comments };
  }

  public addComment(reelId: string, comment: ReelComment) {
    const list = this.comments[reelId] || [];
    this.comments[reelId] = [...list, comment];
    
    // Update reel comment count
    this.reels = this.reels.map((r) => {
      if (r.id === reelId) {
        return {
          ...r,
          commentsCount: r.commentsCount + 1
        };
      }
      return r;
    });

    this.saveToStorage();
    this.notify();
  }

  public toggleCommentLike(reelId: string, commentId: string) {
    const list = this.comments[reelId] || [];
    this.comments[reelId] = list.map((c) => {
      if (c.id === commentId) {
        const nextLiked = !c.isLiked;
        return {
          ...c,
          isLiked: nextLiked,
          likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
        };
      }
      return c;
    });
    this.saveToStorage();
  }

  public isFollowing(handle: string): boolean {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    return this.followedHandles.has(cleanHandle);
  }

  public toggleFollowRider(handle: string): boolean {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const willFollow = !this.followedHandles.has(cleanHandle);
    if (willFollow) {
      this.followedHandles.add(cleanHandle);
    } else {
      this.followedHandles.delete(cleanHandle);
    }
    this.saveToStorage();
    return willFollow;
  }

  public getRiderProfile(
    riderName: string,
    riderHandle: string,
    avatarUrl?: string
  ): RiderReelProfile {
    const cleanHandle = riderHandle.startsWith('@') ? riderHandle : `@${riderHandle}`;
    const riderReels = this.getRiderReels(cleanHandle);
    const isFollowed = this.isFollowing(cleanHandle);

    // Dynamic bio and followers calculation based on rider name or handle
    const bios: Record<string, { bio: string; followers: number; following: number; distance: number }> = {
      '@caner_climber': {
        bio: 'Kartepe & Uludağ tırmanış tutkunu 🏔️ Yol bisikleti & dik eğim hastası. Peloton tırmanış lideri.',
        followers: 2450,
        following: 310,
        distance: 1420
      },
      '@aero_cyclist': {
        bio: 'Aero her şeydir 💨 50mm karbon jantlar, zamana karşı ve kriter uzmanı. Stelvio & Alp aşığı.',
        followers: 4890,
        following: 195,
        distance: 2850
      },
      '@peloton_pro': {
        bio: 'Resmi Peloton Pro Takımı ⚡ Caddebostan kriter finişleri, sprint trenleri ve takım antrenmanları.',
        followers: 12400,
        following: 84,
        distance: 5120
      },
      '@ece_climbs': {
        bio: 'Uzun mesafe & gün batımı sürüşleri 🌅 İstanbul Gravel & Road topluluğu kurucusu.',
        followers: 3820,
        following: 420,
        distance: 1980
      }
    };

    const info = bios[cleanHandle] || {
      bio: 'Tutkulu bisikletçi · Peloton reels topluluğu üyesi 🚴‍♂️',
      followers: 450 + (riderReels.length * 120),
      following: 140,
      distance: 620
    };

    return {
      name: riderName,
      handle: cleanHandle,
      avatar: avatarUrl || (riderReels[0]?.riderAvatar),
      bio: info.bio,
      isVerified: true,
      followersCount: info.followers + (isFollowed ? 1 : 0),
      followingCount: info.following,
      reelsCount: riderReels.length,
      isFollowing: isFollowed,
      totalDistanceKm: info.distance
    };
  }
}

export const reelsService = new ReelsService();
