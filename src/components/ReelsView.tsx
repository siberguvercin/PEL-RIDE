import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Zap,
  TrendingUp,
  Activity,
  PlusCircle,
  Send,
  X,
  CheckCircle2,
  Flame,
  Award,
  Music,
  Disc3,
  ChevronDown,
  ChevronUp,
  Compass,
  Film,
  Upload,
  Image as ImageIcon,
  Copy,
  Camera,
  ExternalLink,
  Mic,
  MicOff,
  Search,
  Headphones,
  Radio,
  Info,
  Square,
  CornerDownRight,
  User,
  Bike,
  Video,
  SwitchCamera,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { CyclingReel, ReelComment, RiderReelProfile } from '../types/reels';
import { SavedRide } from '../types';
import { reelsService } from '../services/reelsService';
import { ReelRiderProfileModal } from './ReelRiderProfileModal';
import { validateContent, cleanProfanity } from '../utils/profanityFilter';

export interface CopyrightedTrack {
  id: string;
  artist: string;
  title: string;
  fullTitle: string;
  album: string;
  copyright: string;
  duration: string;
  reelsCount: string;
  coverUrl: string;
}

export const COPYRIGHTED_TRACKS: CopyrightedTrack[] = [
  {
    id: 'tame-impala-less-i-know',
    artist: 'Tame Impala',
    title: 'The Less I Know The Better',
    fullTitle: 'Tame Impala - The Less I Know The Better',
    album: 'Currents (2015)',
    copyright: '© Modular Recordings Pty Ltd under exclusive licence to Universal Music Australia',
    duration: '03:36',
    reelsCount: '124.8K',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'beck-loser',
    artist: 'Beck',
    title: 'Loser',
    fullTitle: 'Beck - Loser',
    album: 'Mellow Gold (1994)',
    copyright: '© DGC Records / Geffen Records / Universal Music Group',
    duration: '03:55',
    reelsCount: '89.4K',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'tame-impala-let-it-happen',
    artist: 'Tame Impala',
    title: 'Let It Happen',
    fullTitle: 'Tame Impala - Let It Happen',
    album: 'Currents (2015)',
    copyright: '© Modular Recordings / Universal Music Australia',
    duration: '07:48',
    reelsCount: '67.2K',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'tame-impala-borderline',
    artist: 'Tame Impala',
    title: 'Borderline',
    fullTitle: 'Tame Impala - Borderline',
    album: 'The Slow Rush (2020)',
    copyright: '© Island Records Australia / Universal Music',
    duration: '03:57',
    reelsCount: '54.1K',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'daft-punk-harder',
    artist: 'Daft Punk',
    title: 'Harder, Better, Faster, Stronger',
    fullTitle: 'Daft Punk - Harder, Better, Faster, Stronger',
    album: 'Discovery (2001)',
    copyright: '© Daft Life Ltd. / Parlophone / Warner Music Group',
    duration: '03:44',
    reelsCount: '158.3K',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'the-weeknd-blinding-lights',
    artist: 'The Weeknd',
    title: 'Blinding Lights',
    fullTitle: 'The Weeknd - Blinding Lights',
    album: 'After Hours (2020)',
    copyright: '© XO Records / Republic Records / UMG Recordings',
    duration: '03:20',
    reelsCount: '210.6K',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80'
  }
];

export interface PresetCyclingVideo {
  id: string;
  title: string;
  caption: string;
  location: string;
  videoUrl: string;
  posterUrl: string;
  speed: string;
  watts: string;
  gradient: string;
  category: string;
}

export const PRESET_CYCLING_VIDEOS: PresetCyclingVideo[] = [
  {
    id: 'preset-kartepe-climb',
    title: 'Kartepe Zirve Tırmanışı (%12 Eğim)',
    caption: 'Kartepe virajlarında %12 dik eğimde bacaklar yanıyor! Zirveye son 500m ⛰️🚴‍♂️',
    location: 'Kartepe Zirve Yolu, Kocaeli',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-on-a-bicycle-during-a-competition-41482-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    speed: '14.5',
    watts: '380',
    gradient: '11.8',
    category: 'Tırmanış'
  },
  {
    id: 'preset-stelvio-descent',
    title: 'Alp Stelvio Virajları İnişi (72 km/s)',
    caption: 'Alp inişinde 72 km/s aero çizgisinde akmak saf adrenalin! Viraj çizgileri harika 🏔️💨',
    location: 'Stelvio Geçidi, Alpler',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-along-the-highway-41484-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    speed: '72.4',
    watts: '310',
    gradient: '-8.5',
    category: 'İniş & Aero'
  },
  {
    id: 'preset-caddebostan-sprint',
    title: 'Peloton Sprint Treni & Finiş',
    caption: 'Son 200m sprint treni patlaması! 1240W pik güçle finiş çizgisine uçuş ⚡🚴‍♂️',
    location: 'Caddebostan Sahil Parkuru, İstanbul',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-competing-in-a-race-41483-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    speed: '64.2',
    watts: '1180',
    gradient: '0.5',
    category: 'Sprint'
  },
  {
    id: 'preset-coastal-ride',
    title: 'Boğaz Sahil Yolu Temposu',
    caption: 'Boğaz sahilinde rüzgara karşı yüksek kadans sürüşü! 🌊🚴 Sezon hedefleri için tam gaz.',
    location: 'Bebek - Rumeli Hisarı Sahili, İstanbul',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-riding-a-bicycle-along-the-beach-41481-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
    speed: '36.8',
    watts: '290',
    gradient: '1.2',
    category: 'Sahil & Yol'
  }
];

const INITIAL_REELS: CyclingReel[] = [
  {
    id: 'reel-original-voice',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-on-a-bicycle-during-a-competition-41482-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    riderName: 'Caner Pedal',
    riderHandle: '@caner_climber',
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
    isSaved: false
  },
  {
    id: 'reel-tame-impala',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-along-the-highway-41484-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    riderName: 'Aero Pelotoni',
    riderHandle: '@aero_cyclist',
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
    isSaved: false
  },
  {
    id: 'reel-beck-loser',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cyclists-competing-in-a-race-41483-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    riderName: 'Peloton Pro Team',
    riderHandle: '@peloton_pro',
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
    isSaved: true
  },
  {
    id: 'reel-sunset-photo',
    mediaType: 'image',
    photoUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80',
    riderName: 'Ece Aydın',
    riderHandle: '@ece_climbs',
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
    isSaved: false
  }
];

const INITIAL_COMMENTS: Record<string, ReelComment[]> = {
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
  'reel-beck-loser': [
    {
      id: 'c3',
      reelId: 'reel-beck-loser',
      userName: 'Emre Watt',
      userHandle: 'emre_power',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      badge: 'Sprinter',
      isAuthor: false,
      text: 'Beck - Loser seçimi tam nostalji finişi! Son 200m patlaması resmen füze gibi 🚀🔥',
      timestamp: Date.now() - 14400000,
      likesCount: 56,
      isLiked: true
    },
    {
      id: 'c4',
      reelId: 'reel-beck-loser',
      userName: 'Deniz Kriteryum',
      userHandle: 'deniz_crit',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      badge: 'Kulüp',
      isAuthor: false,
      text: 'Caddebostan virajında arkadaki tren dağıldı resmen, harika finiş!',
      timestamp: Date.now() - 10800000,
      likesCount: 23,
      isLiked: false
    }
  ],
  'reel-sunset-photo': [
    {
      id: 'c-sp-1',
      reelId: 'reel-sunset-photo',
      userName: 'Kaan Gece',
      userHandle: 'kaan_biker',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      badge: 'Gravel',
      isAuthor: false,
      text: 'Çamlıca gün batımı ışığı kadroya çok iyi vurmuş 📸 Müzikle fotoğraf akışı huzur veriyor ✨',
      timestamp: Date.now() - 1000 * 60 * 50,
      likesCount: 29,
      isLiked: true
    },
    {
      id: 'c-sp-2',
      reelId: 'reel-sunset-photo',
      userName: 'Ece Aydın',
      userHandle: 'ece_climbs',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      badge: 'Yazar',
      isAuthor: true,
      text: 'Teşekkürler! 110 km sonrası Çamlıca yokuşu zordu ama bu manzaraya değdi 🌅🚴‍♀️',
      timestamp: Date.now() - 1000 * 60 * 30,
      likesCount: 16,
      isLiked: false
    }
  ]
};

// Helper to format relative comment time in Turkish
const formatCommentTime = (timestamp: number): string => {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Şimdi';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} g`;
};

async function compressReelPhotoToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fotoğraf dosyası okunamadı'));
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Boş görsel verisi'));
        return;
      }
      const img = new window.Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const maxDim = 1080;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

interface ReelsViewProps {
  savedRides?: SavedRide[];
  onStartPrivateChat?: (rider: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ savedRides = [], onStartPrivateChat }) => {
  const [reels, setReels] = useState<CyclingReel[]>(() => reelsService.getReels());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Rider Profile Modal (Reels'ta profile tıklayınca açılan profil)
  const [selectedRiderProfile, setSelectedRiderProfile] = useState<RiderReelProfile | null>(null);
  const [isRiderProfileOpen, setIsRiderProfileOpen] = useState(false);

  // Animated heart burst on double-tap
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Comments Drawer
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, ReelComment[]>>(() => reelsService.getAllCommentsMap());
  const [newCommentText, setNewCommentText] = useState('');
  const [commentWarning, setCommentWarning] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Delete Reel confirmation state
  const [confirmDeleteReelId, setConfirmDeleteReelId] = useState<string | null>(null);

  // Subscribe to reelsService changes
  useEffect(() => {
    const unsub = reelsService.subscribe((updatedList) => {
      setReels(updatedList);
      setCommentsMap(reelsService.getAllCommentsMap());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (reels.length === 0) {
      if (currentIndex !== 0) setCurrentIndex(0);
    } else if (currentIndex >= reels.length) {
      setCurrentIndex(reels.length - 1);
    }
  }, [reels.length, currentIndex]);

  const handleConfirmDeleteReel = (reelId: string) => {
    const deleted = reelsService.deleteReel(reelId);
    setConfirmDeleteReelId(null);
    if (deleted) {
      if (photoAudioRef.current) {
        photoAudioRef.current.pause();
      }
      setIsCommentsOpen(false);
      setIsShareModalOpen(false);
      setToastMessage('Reel kalıcı olarak silindi.');
      setTimeout(() => setToastMessage(null), 2600);
    }
  };

  const handleOpenRiderProfile = (name: string, handle: string, avatar?: string) => {
    const profile = reelsService.getRiderProfile(name, handle, avatar);
    setSelectedRiderProfile(profile);
    setIsRiderProfileOpen(true);
  };

  const handleSelectReelFromProfile = (selectedReel: CyclingReel) => {
    const idx = reels.findIndex((r) => r.id === selectedReel.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      setReels([selectedReel, ...reels]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
    setIsCommentsOpen(false);
    setIsRiderProfileOpen(false);
  };

  // Swipe & Scroll Navigation Refs
  const touchStartYRef = useRef<number>(0);
  const touchEndYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isSwipedRef = useRef<boolean>(false);
  const wheelCooldownRef = useRef<number>(0);

  // Music & Audio Sheet Modal (Telifli Şarkılar)
  const [isAudioSheetOpen, setIsAudioSheetOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<CopyrightedTrack>(COPYRIGHTED_TRACKS[0]);

  // Social Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedInstagramText, setCopiedInstagramText] = useState(false);

  // Audio Source: 'spotify' or 'custom_voice'
  const [uploadAudioType, setUploadAudioType] = useState<'spotify' | 'custom_voice'>('spotify');

  // Spotify Search & Track Selection (Spotify Client ID: eff4bf4dc4ce45d8b9cc17ccf0ea199d)
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<any>(null);

  // Custom Voice Recording & Audio File Upload (Kendi Sesin Yükleme & Canlı Mikrofon Kaydı)
  const [customVoiceFile, setCustomVoiceFile] = useState<File | null>(null);
  const [customVoiceUrl, setCustomVoiceUrl] = useState<string>('');
  const [customVoiceTitle, setCustomVoiceTitle] = useState('Orijinal Ses');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);

  // Upload Clip & Photo Modal (Yeni Reel Ekle: Sürüş Videosu, Normal Kamera Kaydı & Galeri)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSourceTab, setUploadSourceTab] = useState<'gallery' | 'camera' | 'rides' | 'presets'>('gallery');
  const [uploadMediaType, setUploadMediaType] = useState<'video' | 'image'>('video');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoAudioRef = useRef<HTMLAudioElement | null>(null);

  // Normal Camera Video Recording inside Yeni Reel Ekle (Yayınsız yerel kayıt)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [cameraRecordSec, setCameraRecordSec] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraVideoChunksRef = useRef<Blob[]>([]);
  const cameraRecordTimerRef = useRef<any>(null);

  // User profile auto-detect for Reel author
  const [uploadRiderName, setUploadRiderName] = useState(() => {
    try {
      const gUser = localStorage.getItem('pel_google_user');
      if (gUser) {
        const parsed = JSON.parse(gUser);
        if (parsed.name && !String(parsed.id || '').startsWith('google-kaya')) return parsed.name;
      }
      const sockName = localStorage.getItem('pel_user_name');
      if (sockName) return sockName;
    } catch (_) {}
    return 'Bisikletçi';
  });

  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadLocation, setUploadLocation] = useState('Caddebostan Sahil Parkuru');
  const [uploadSongTitle, setUploadSongTitle] = useState('Tame Impala - The Less I Know The Better');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cycling Telemetry HUD option
  const [includeTelemetry, setIncludeTelemetry] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState('34.2');
  const [uploadWatts, setUploadWatts] = useState('285');
  const [uploadGradient, setUploadGradient] = useState('3.8');

  // Saved Rides list synced from authenticated user state
  const [savedRidesList, setSavedRidesList] = useState<SavedRide[]>(savedRides);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  // Stop & cleanup Reels camera recording resources
  const stopReelsCamera = () => {
    if (cameraRecordTimerRef.current) {
      clearInterval(cameraRecordTimerRef.current);
      cameraRecordTimerRef.current = null;
    }
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      try {
        cameraRecorderRef.current.stop();
      } catch (_) {}
    }
    cameraRecorderRef.current = null;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraRecording(false);
    setIsCameraActive(false);
  };

  const startReelsCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tarayıcınız kamera kaydını desteklemiyor.');
      return;
    }
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      if (cameraVideoPreviewRef.current) {
        cameraVideoPreviewRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setCameraError('Kamera veya mikrofon izni alınamadı: ' + (err?.message || 'İzin reddedildi'));
    }
  };

  const startCameraVideoRecording = () => {
    if (!cameraStreamRef.current) {
      setCameraError('Önce kamerayı başlatın.');
      return;
    }
    setCameraError(null);
    cameraVideoChunksRef.current = [];
    setCameraRecordSec(0);

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    let selectedMime = '';
    if (typeof MediaRecorder !== 'undefined') {
      for (const candidate of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          selectedMime = candidate;
          break;
        }
      }
    }

    try {
      const recorder = selectedMime
        ? new MediaRecorder(cameraStreamRef.current, { mimeType: selectedMime })
        : new MediaRecorder(cameraStreamRef.current);
      cameraRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          cameraVideoChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (cameraRecordTimerRef.current) {
          clearInterval(cameraRecordTimerRef.current);
          cameraRecordTimerRef.current = null;
        }
        setIsCameraRecording(false);
        if (cameraVideoChunksRef.current.length > 0) {
          const blob = new Blob(cameraVideoChunksRef.current, {
            type: selectedMime || 'video/webm'
          });
          const recordedUrl = URL.createObjectURL(blob);
          setUploadMediaType('video');
          setUploadFile(null);
          setUploadPreviewUrl(recordedUrl);
          stopReelsCamera();
          setToastMessage('🎥 Normal kamera kaydı tamamlandı! Şimdi paylaşabilirsiniz.');
          setTimeout(() => setToastMessage(null), 3000);
        }
      };

      recorder.start(500);
      setIsCameraRecording(true);
      cameraRecordTimerRef.current = setInterval(() => {
        setCameraRecordSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setCameraError('Video kaydı başlatılamadı: ' + (err?.message || 'Bilinmeyen hata'));
    }
  };

  const stopCameraVideoRecording = () => {
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      cameraRecorderRef.current.stop();
    }
  };

  const captureCameraPhoto = () => {
    const videoEl = cameraVideoPreviewRef.current;
    if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) {
      setCameraError('Kamera görüntüsü henüz hazır değil.');
      return;
    }
    const maxDim = 1080;
    const scale = Math.min(1, maxDim / Math.max(videoEl.videoWidth, videoEl.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(videoEl.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(videoEl.videoHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    setUploadMediaType('image');
    setUploadFile(null);
    setUploadPreviewUrl(dataUrl);
    stopReelsCamera();
    setToastMessage('Fotoğraf çekildi ve Reels için hazırlandı.');
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Sync saved rides and manage camera lifecycle when upload modal opens
  useEffect(() => {
    setSavedRidesList(savedRides);
    if (!isUploadOpen) {
      stopReelsCamera();
    }
  }, [isUploadOpen, savedRides]);

  useEffect(() => {
    if (isUploadOpen && uploadSourceTab === 'camera' && !uploadPreviewUrl) {
      startReelsCamera(cameraFacingMode);
    } else if (uploadSourceTab !== 'camera') {
      stopReelsCamera();
    }
    return () => {
      if (!isUploadOpen) {
        stopReelsCamera();
      }
    };
  }, [uploadSourceTab, cameraFacingMode, isUploadOpen, uploadPreviewUrl]);

  const handleSelectPresetVideo = (preset: PresetCyclingVideo) => {
    setUploadMediaType('video');
    setUploadPreviewUrl(preset.videoUrl);
    setUploadFile(null);
    setUploadCaption(preset.caption);
    setUploadLocation(preset.location);
    setUploadSpeed(preset.speed);
    setUploadWatts(preset.watts);
    setUploadGradient(preset.gradient);
    setIncludeTelemetry(true);
    setToastMessage(`"${preset.title}" sürüş videosu seçildi! 🎬`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectSavedRide = (ride: any) => {
    setSelectedRideId(ride.id);
    setUploadCaption(`${ride.title} - ${ride.distanceKm} km antrenman videosu! 🚴💨`);
    setUploadLocation(ride.title.split(' ')[0] + ' Parkuru');
    setUploadSpeed(ride.avgSpeedKmH ? ride.avgSpeedKmH.toString() : '32.4');
    setUploadWatts(ride.avgWatts ? ride.avgWatts.toString() : '260');
    setUploadGradient('4.0');
    setIncludeTelemetry(true);
    if (!uploadPreviewUrl) {
      setUploadPreviewUrl('https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-along-the-highway-41484-large.mp4');
      setUploadMediaType('video');
    }
    setToastMessage(`"${ride.title}" verileri eklendi! 🚴`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const currentReel = reels[currentIndex];

  // Load Popular Spotify tracks on mount
  useEffect(() => {
    fetch('/api/spotify/popular')
      .then((res) => res.json())
      .then((data) => {
        if (data?.tracks && data.tracks.length > 0) {
          setSpotifyTracks(data.tracks);
          if (!selectedSpotifyTrack) {
            setSelectedSpotifyTrack(data.tracks[0]);
          }
        }
      })
      .catch((err) => console.warn('Failed to load initial Spotify tracks:', err));
  }, []);

  const searchDebounceTimerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

  // Stop preview audio on unmount or modal close
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // Perform Spotify / Music catalog search
  const performSpotifySearch = async (query: string) => {
    const cleanQuery = query.trim();
    setIsSearchingSpotify(true);
    try {
      const url = cleanQuery
        ? `/api/spotify/search?q=${encodeURIComponent(cleanQuery)}`
        : '/api/spotify/popular';
      const res = await fetch(url);
      const data = await res.json();
      if (data?.tracks && Array.isArray(data.tracks)) {
        setSpotifyTracks(data.tracks);
        // If search returned tracks, automatically select first match if none selected or query was explicitly entered
        if (cleanQuery && data.tracks.length > 0) {
          const first = data.tracks[0];
          setSelectedSpotifyTrack(first);
          setUploadSongTitle(`${first.artist} - ${first.name}`);
        }
      }
    } catch (e) {
      console.warn('Spotify search error:', e);
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  // Debounced input change
  const handleSearchQueryChange = (val: string) => {
    setSpotifySearchQuery(val);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    searchDebounceTimerRef.current = setTimeout(() => {
      performSpotifySearch(val);
    }, 400);
  };

  // Toggle mini 30s preview playback for any track
  const toggleTrackPreview = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    if (!track?.previewUrl) return;

    if (previewingTrackId === track.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingTrackId(null);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = track.previewUrl;
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play().catch(() => {});
      setPreviewingTrackId(track.id);
      previewAudioRef.current.onended = () => {
        setPreviewingTrackId(null);
      };
    }
  };

  // Pick track from search results
  const handleSelectTrack = (track: any) => {
    setSelectedSpotifyTrack(track);
    setUploadSongTitle(`${track.artist} - ${track.name}`);
    setToastMessage(`"${track.name}" parçası seçildi 🎵`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Use custom search query as song title directly
  const handleUseQueryAsCustomTrack = (customText?: string) => {
    const title = (customText || spotifySearchQuery).trim();
    if (!title) return;
    const customTrack = {
      id: `custom-track-${Date.now()}`,
      name: title,
      artist: 'Spotify Parçası',
      album: 'Özel Parça',
      albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
      durationFormatted: '03:30',
      previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(title)}`,
      popularity: 90,
      genres: ['custom']
    };
    setSelectedSpotifyTrack(customTrack);
    setUploadSongTitle(title);
    setToastMessage(`"${title}" parçası belirlendi 🎵`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Start Live Microphone Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setCustomVoiceUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
        setToastMessage('Ses kaydı tamamlandı! Klipte orijinal sesiniz olarak çalacak 🎙️');
        setTimeout(() => setToastMessage(null), 3000);
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordingDurationSec(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDurationSec((prev) => {
          if (prev >= 60) {
            stopVoiceRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setToastMessage('Mikrofon erişimine izin verilemedi.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Stop Live Voice Recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Select Custom Voice File from Device
  const handleCustomVoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomVoiceFile(file);
      const url = URL.createObjectURL(file);
      setCustomVoiceUrl(url);
      setCustomVoiceTitle(file.name.replace(/\.[^/.]+$/, ''));
      setToastMessage(`"${file.name}" ses dosyası başarıyla eklendi! 🎙️`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  useEffect(() => {
    // Play active video or photo/custom audio, pause others
    if (currentReel?.mediaType === 'image') {
      // Pause all videos
      videoRefs.current.forEach((video) => {
        if (video) video.pause();
      });
      // Play photo audio or custom voice if active and not muted
      if (photoAudioRef.current) {
        if (!isMuted && isPlaying) {
          photoAudioRef.current.play().catch(() => {});
        } else {
          photoAudioRef.current.pause();
        }
      }
    } else {
      // If video has custom audio / voice or Spotify preview, play audio element synchronously with video
      if (currentReel?.audioUrl && photoAudioRef.current) {
        if (!isMuted && isPlaying) {
          photoAudioRef.current.currentTime = 0;
          photoAudioRef.current.play().catch(() => {});
        } else {
          photoAudioRef.current.pause();
        }
      } else if (photoAudioRef.current) {
        photoAudioRef.current.pause();
      }

      videoRefs.current.forEach((video, idx) => {
        if (video) {
          if (idx === currentIndex) {
            video.currentTime = 0;
            // If custom audio track exists, mute native video track so sound doesn't overlap
            if (currentReel?.audioUrl) {
              video.muted = true;
            } else {
              video.muted = isMuted;
            }
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });
    }
  }, [currentIndex, isMuted, isPlaying, currentReel]);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Touch Swipe Handlers for Reels
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchEndYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
    isSwipedRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const distance = touchStartYRef.current - touchEndYRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped UP -> Next reel
      isSwipedRef.current = true;
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped DOWN -> Prev reel
      isSwipedRef.current = true;
      handlePrev();
    }
  };

  // Mouse Drag to Swipe (Desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartYRef.current = e.clientY;
    touchEndYRef.current = e.clientY;
    isDraggingRef.current = true;
    isSwipedRef.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    touchEndYRef.current = e.clientY;
  };

  const onMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const distance = touchStartYRef.current - touchEndYRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      isSwipedRef.current = true;
      handleNext();
    } else if (distance < -minSwipeDistance) {
      isSwipedRef.current = true;
      handlePrev();
    }
  };

  // Trackpad / Mouse Wheel Scroll
  const onWheel = (e: React.WheelEvent) => {
    if (isCommentsOpen || isShareModalOpen || isAudioSheetOpen || isUploadOpen) return;
    const now = Date.now();
    if (now - wheelCooldownRef.current < 450) return;

    if (e.deltaY > 30) {
      wheelCooldownRef.current = now;
      handleNext();
    } else if (e.deltaY < -30) {
      wheelCooldownRef.current = now;
      handlePrev();
    }
  };

  // Keyboard Navigation (ArrowDown, ArrowUp, Space, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommentsOpen || isShareModalOpen || isAudioSheetOpen || isUploadOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length, isCommentsOpen, isShareModalOpen, isAudioSheetOpen, isUploadOpen]);

  const openAudioModal = (songTitle?: string) => {
    if (songTitle) {
      const match = COPYRIGHTED_TRACKS.find(
        (t) =>
          songTitle.toLowerCase().includes(t.title.toLowerCase()) ||
          songTitle.toLowerCase().includes(t.artist.toLowerCase())
      );
      if (match) {
        setActiveTrack(match);
      }
    }
    setIsAudioSheetOpen(true);
  };

  // Toggle Like with animation & reelsService persistence
  const handleToggleLike = (reelId: string) => {
    const updated = reelsService.toggleLike(reelId);
    if (updated) {
      setReels((prev) => prev.map((r) => (r.id === reelId ? updated! : r)));
    }
  };

  // Double tap video/photo trigger
  const handleVideoTouch = () => {
    if (isSwipedRef.current) {
      isSwipedRef.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      if (!currentReel.isLiked) {
        handleToggleLike(currentReel.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else {
      // Single tap: toggle play / pause
      if (currentReel.mediaType === 'image') {
        setIsPlaying(!isPlaying);
      } else {
        const video = videoRefs.current[currentIndex];
        if (video) {
          if (video.paused) {
            video.play();
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        }
      }
    }
    lastTapRef.current = now;
  };

  // Toggle Save
  const handleToggleSave = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, isSaved: !r.isSaved } : r))
    );
  };

  const handleDirectPlatformShare = (platform: 'instagram' | 'whatsapp' | 'twitter' | 'telegram' | 'facebook' | 'native') => {
    const url = window.location.href;
    const shareText = `🎬 REELS: ${currentReel.riderName} - "${currentReel.caption}"\n🎵 Müzik: ${currentReel.songTitle}${currentReel.location ? `\n📍 Konum: ${currentReel.location}` : ''}`;

    if (platform === 'instagram') {
      // Instagram: copy formatted caption & tags to clipboard and open Instagram
      navigator.clipboard.writeText(`${shareText}\n\n#cycling #peloton #pelreels #bisiklet`);
      setCopiedInstagramText(true);
      setToastMessage('Instagram için başlık ve etiketler kopyalandı! 📸');
      setTimeout(() => setCopiedInstagramText(false), 3000);
      setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
      }, 700);
      return;
    }

    if (platform === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\nİzle: ${url}`)}`;
      window.open(waUrl, '_blank');
      return;
    }

    if (platform === 'twitter') {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
      window.open(tweetUrl, '_blank');
      return;
    }

    if (platform === 'telegram') {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
      window.open(tgUrl, '_blank');
      return;
    }

    if (platform === 'facebook') {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(fbUrl, '_blank');
      return;
    }

    if (platform === 'native') {
      if (navigator.share) {
        navigator.share({
          title: `PEL REELS - ${currentReel.riderName}`,
          text: shareText,
          url: url
        }).catch(() => {});
      } else {
        handleCopyLink();
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShareLink(true);
    setToastMessage('Reels bağlantısı panoya kopyalandı! 🚀');
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  // Toggle Like on a Comment
  const handleToggleCommentLike = (commentId: string) => {
    if (!currentReel) return;
    reelsService.toggleCommentLike(currentReel.id, commentId);
    setCommentsMap(reelsService.getAllCommentsMap());
  };

  // Reply to a user in comments
  const handleReplyToComment = (userHandle?: string, userName?: string) => {
    const mention = userHandle ? (userHandle.startsWith('@') ? userHandle : `@${userHandle}`) : `@${userName}`;
    setNewCommentText((prev) => (prev ? `${prev} ${mention} ` : `${mention} `));
    commentInputRef.current?.focus();
  };

  // Quick Emoji Click
  const handleQuickEmoji = (emoji: string) => {
    setNewCommentText((prev) => `${prev}${emoji}`);
    commentInputRef.current?.focus();
  };

  // Quick Note Click
  const handleQuickNote = (note: string) => {
    setNewCommentText(note);
    commentInputRef.current?.focus();
  };

  // Add Comment with Sportsmanship Filter & Profile Avatar
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentReel) return;

    const validation = validateContent(newCommentText.trim());
    if (!validation.isValid) {
      setCommentWarning('Sportmenlik kuralları: Yorumunuzdaki uygunsuz ifadeler sansürlendi.');
      setTimeout(() => setCommentWarning(null), 3500);
    }

    const cleanText = cleanProfanity(newCommentText.trim());

    const comment: ReelComment = {
      id: `c-${Date.now()}`,
      reelId: currentReel.id,
      userName: 'Siz',
      userHandle: 'siz_peloton',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      badge: 'Peloton',
      isAuthor: currentReel.isMyReel || false,
      text: cleanText,
      timestamp: Date.now(),
      likesCount: 0,
      isLiked: false
    };

    reelsService.addComment(currentReel.id, comment);
    setCommentsMap(reelsService.getAllCommentsMap());

    setNewCommentText('');
    setToastMessage('Yorumunuz paylaşıldı! 💬');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // File Change for Upload (Photo or Video)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadFile(file);
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if (isImg) {
      setUploadMediaType('image');
      try {
        const persistentDataUrl = await compressReelPhotoToDataUrl(file);
        setUploadPreviewUrl(persistentDataUrl);
        setToastMessage('Fotoğraf yüklendi ve Reels önizlemesine eklendi.');
        setTimeout(() => setToastMessage(null), 2500);
      } catch {
        const previewUrl = URL.createObjectURL(file);
        setUploadPreviewUrl(previewUrl);
      }
      return;
    }

    if (isVid) {
      setUploadMediaType('video');
    }
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);
  };

  // Upload Clip / Photo
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const riderNameClean = uploadRiderName.trim() || 'Peloton Sporcusu';
    const riderHandleClean = '@' + riderNameClean.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const isImage = uploadMediaType === 'image';
    const finalPhotoUrl = isImage
      ? (uploadPreviewUrl || 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80')
      : '';
    const finalVideoUrl = isImage
      ? ''
      : (uploadPreviewUrl || 'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-along-the-highway-41484-large.mp4');
    const finalPosterUrl = isImage
      ? finalPhotoUrl
      : 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80';

    const isVoice = uploadAudioType === 'custom_voice';
    const finalAudioSourceType = isVoice ? 'custom_voice' : 'spotify';
    const finalSongTitle = isVoice
      ? (customVoiceTitle.trim() || `Orijinal Ses - ${riderNameClean}`)
      : (uploadSongTitle?.trim() || (selectedSpotifyTrack ? `${selectedSpotifyTrack.artist} - ${selectedSpotifyTrack.name}` : 'Tame Impala - The Less I Know The Better'));
    const finalAudioUrl = isVoice
      ? (customVoiceUrl || 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3')
      : (selectedSpotifyTrack?.previewUrl || 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3');
    const finalSpotifyUrl = !isVoice ? selectedSpotifyTrack?.spotifyUrl : undefined;
    const finalSpotifyId = !isVoice ? selectedSpotifyTrack?.id : undefined;

    const newReel: CyclingReel = {
      id: `reel-${Date.now()}`,
      mediaType: isImage ? 'image' : 'video',
      videoUrl: finalVideoUrl,
      photoUrl: finalPhotoUrl,
      posterUrl: finalPosterUrl,
      riderName: riderNameClean,
      riderHandle: riderHandleClean,
      isVerified: true,
      caption: uploadCaption || (isImage ? 'Bugünkü antrenmandan anlık kare! 📸🚴' : 'Bugünkü antrenmandan dikey klip! 🚴🔥'),
      tags: isVoice
        ? (isImage ? ['#photoReel', '#orijinalses', '#cycling'] : ['#orijinalses', '#cycling', '#reels'])
        : (isImage ? ['#photoReel', '#cycling', '#spotify'] : ['#peloton', '#cycling', '#spotify']),
      location: uploadLocation,
      songTitle: finalSongTitle,
      audioSourceType: finalAudioSourceType,
      audioUrl: finalAudioUrl,
      customVoiceTitle: isVoice ? finalSongTitle : undefined,
      spotifyUrl: finalSpotifyUrl,
      spotifyTrackId: finalSpotifyId,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      durationSec: 15,
      date: 'Şimdi',
      isLiked: true,
      isMyReel: true,
      viewsCount: 1,
      telemetry: includeTelemetry
        ? {
            speedKmH: parseFloat(uploadSpeed) || 32.4,
            watts: parseInt(uploadWatts) || 275,
            gradientPct: parseFloat(uploadGradient) || 3.5,
            heartRateBpm: 168,
            cadenceRpm: 92,
            distanceKm: 34.0
          }
        : undefined
    };

    reelsService.addReel(newReel);
    setCurrentIndex(0);
    setIsUploadOpen(false);
    setUploadCaption('');
    setUploadFile(null);
    setUploadPreviewUrl('');
    setCustomVoiceFile(null);
    setCustomVoiceUrl('');
    setCustomVoiceTitle('Orijinal Ses');
    setToastMessage(
      isVoice
        ? '🎙️ Kendi sesinizle Reels klibiniz yayınlandı!'
        : isImage
        ? '📸 Fotoğraf Reels klibiniz Spotify müziğiyle akışta yayınlandı!'
        : '🎬 Video Reels klibiniz Spotify müziğiyle yayınlandı!'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentComments = currentReel ? commentsMap[currentReel.id] || [] : [];

  return (
    <div className="flex-1 w-full max-w-full min-w-0 bg-black text-white relative flex items-center justify-center overflow-hidden h-full select-none overscroll-x-none">
      {/* If no reels exist: show empty state */}
      {reels.length === 0 || !currentReel ? (
        <div className="flex-1 bg-[#0F0F12] text-white flex flex-col items-center justify-center p-6 text-center select-none relative h-full w-full max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/25 text-[#FC4C02] flex items-center justify-center mb-4">
            <Film className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02] mb-2">
            PEL REELS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
            Henüz Yayınlanan Reels Yok
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
            Şu anda akışta paylaşılan bisiklet klibi veya fotoğraf bulunmuyor. İlk fotoğraf ya da videoyu hemen yükleyin.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUploadSourceTab('gallery');
                setUploadMediaType('image');
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 cursor-pointer transition"
            >
              <ImageIcon className="w-4 h-4 text-[#FC4C02]" />
              <span>Fotoğraf Ekle</span>
            </button>
            <button
              onClick={() => {
                setUploadSourceTab('gallery');
                setUploadMediaType('video');
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yeni Reel Ekle</span>
            </button>
          </div>
        </div>
      ) : (
        /* 9:16 Center Video Player Container */
        <div className="relative w-full max-w-md h-full flex flex-col justify-between overflow-hidden shadow-2xl bg-[#0F0F12]">
        {/* Videos Stack with Touch & Mouse Swipe Gestures */}
        <div
          onClick={handleVideoTouch}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onWheel={onWheel}
          className="absolute inset-0 cursor-pointer overflow-hidden flex items-center justify-center bg-black touch-none select-none"
        >
          {reels.map((reel, index) => {
            const isImage = reel.mediaType === 'image' || (!reel.videoUrl && !!reel.photoUrl);
            const translateY = (index - currentIndex) * 100;
            const isCurrent = index === currentIndex;

            if (isImage) {
              return (
                <div
                  key={reel.id}
                  className="absolute inset-0 w-full h-full overflow-hidden will-change-transform"
                  style={{
                    transform: `translateY(${translateY}%)`,
                    transition: 'transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    zIndex: isCurrent ? 10 : 0
                  }}
                >
                  <img
                    src={reel.photoUrl || reel.posterUrl}
                    alt={reel.caption}
                    className="w-full h-full object-cover scale-100 transition-transform duration-[12000ms] ease-out hover:scale-105 pointer-events-none"
                  />
                  {/* Photo Reel Audio (Custom Voice or Spotify / Preset) */}
                  {isCurrent && (
                    <audio
                      ref={photoAudioRef}
                      src={reel.audioUrl || "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3"}
                      loop
                      muted={isMuted}
                    />
                  )}
                  {/* Instagram-style Photo Badge */}
                  <div className="absolute top-16 left-4 z-20">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                      <ImageIcon className="w-3 h-3 text-[#FC4C02]" />
                      <span>Fotoğraf Reels</span>
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={reel.id}
                className="absolute inset-0 w-full h-full overflow-hidden will-change-transform"
                style={{
                  transform: `translateY(${translateY}%)`,
                  transition: 'transform 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  zIndex: isCurrent ? 10 : 0
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={reel.videoUrl}
                  poster={reel.posterUrl}
                  loop
                  playsInline
                  muted={reel.audioUrl ? true : isMuted}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {/* Synchronized Custom Voice or Spotify Audio Track for Video */}
                {isCurrent && reel.audioUrl && (
                  <audio
                    ref={photoAudioRef}
                    src={reel.audioUrl}
                    loop
                    muted={isMuted}
                  />
                )}
              </div>
            );
          })}

          {/* Top Gradient Shadow for Readability */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-20 pointer-events-none" />

          {/* Bottom Gradient Shadow for Captions */}
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none" />

          {/* Double-Tap Big Pulsing Heart Burst */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-pulse">
              <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-2xl" />
            </div>
          )}

          {/* Pause / Play Indicator when tapped */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Top Header Bar */}
        <div className="relative z-30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-[#FC4C02] uppercase flex items-center gap-1">
              <Flame className="w-4 h-4 fill-current" />
              <span>PEL REELS</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="text-xs font-bold text-zinc-300">
              {currentIndex + 1} / {reels.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Delete Current Reel */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteReelId(currentReel.id);
              }}
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-rose-600 hover:border-rose-500 transition cursor-pointer"
              title="Bu Reel'i Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Audio Mute/Unmute */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/70 transition cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FC4C02]" />}
            </button>

            {/* Quick Photo Upload Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadSourceTab('gallery');
                setUploadMediaType('image');
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition cursor-pointer"
              title="Reels'e Fotoğraf Yükle"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span className="hidden sm:inline">Fotoğraf</span>
            </button>

            {/* Yeni Reel Ekle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold transition cursor-pointer"
              title="Yeni Reel Ekle (Fotoğraf veya video yükle)"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yeni Reel Ekle</span>
            </button>
          </div>
        </div>

        {/* Middle Vertical Swipe Navigation Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 cursor-pointer shadow-lg"
              title="Önceki Klip"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}

          {currentIndex < reels.length - 1 && (
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 cursor-pointer shadow-lg"
              title="Sonraki Klip"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Area: Rider Info (Left) & Instagram Action Column (Right) */}
        <div className="relative z-30 p-4 pb-20 sm:pb-6 flex items-end justify-between gap-3">
          {/* Left Info: Rider, Caption, Tags, Audio */}
          <div className="flex-1 space-y-2 min-w-0 pr-2">
            {/* Rider Identity (Click to open Rider Profile & Reels Grid) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRiderProfile(
                  currentReel.riderName,
                  currentReel.riderHandle,
                  currentReel.riderAvatar
                );
              }}
              className="flex items-center gap-2.5 cursor-pointer group/rider select-none"
              title={`${currentReel.riderName} profilini ve tüm reels kliplerini gör`}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FC4C02] via-amber-500 to-rose-500 p-0.5 flex items-center justify-center shadow-lg group-hover/rider:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[#18181D] overflow-hidden flex items-center justify-center font-black text-xs text-white">
                    {currentReel.riderAvatar ? (
                      <img
                        src={currentReel.riderAvatar}
                        alt={currentReel.riderName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentReel.riderName.charAt(0)
                    )}
                  </div>
                </div>
                {currentReel.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FC4C02] text-white flex items-center justify-center border-2 border-black shadow">
                    <CheckCircle2 className="w-2.5 h-2.5 fill-current" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-xs text-white drop-shadow-md group-hover/rider:text-[#FC4C02] transition-colors">
                    {currentReel.riderName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/15 text-zinc-200 font-bold group-hover/rider:bg-[#FC4C02] group-hover/rider:text-white transition">
                    Profil ↗
                  </span>
                </div>
                <span className="text-[11px] text-zinc-300 font-mono group-hover/rider:text-white transition-colors block mt-0.5">
                  {currentReel.riderHandle}
                </span>
              </div>
            </div>

            {/* Caption */}
            <p className="text-xs text-white leading-relaxed line-clamp-3 drop-shadow-md">
              {currentReel.caption}
            </p>

            {/* Location Pill */}
            {currentReel.location && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                <Compass className="w-3 h-3 text-[#FC4C02]" />
                <span className="truncate">{currentReel.location}</span>
              </div>
            )}

            {/* Audio Track Pill: Spotify / Custom Voice / Telifli */}
            <button
              onClick={() => openAudioModal(currentReel.songTitle)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-[11px] text-zinc-100 transition cursor-pointer active:scale-95 group max-w-full"
              title="Ses & Müzik Detayları"
            >
              {currentReel.audioSourceType === 'custom_voice' || currentReel.audioSourceType === 'custom_upload' ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="truncate max-w-[190px] font-semibold text-amber-200">
                    {currentReel.customVoiceTitle || currentReel.songTitle || 'Orijinal Ses'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black uppercase tracking-wider border border-amber-500/30">
                    Orijinal Ses
                  </span>
                </>
              ) : currentReel.audioSourceType === 'spotify' || currentReel.spotifyTrackId ? (
                <>
                  <Disc3 className="w-3.5 h-3.5 text-[#1DB954] animate-spin" style={{ animationDuration: '3.5s' }} />
                  <span className="truncate max-w-[190px] font-semibold">{currentReel.songTitle}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#1DB954]/20 text-[#1DB954] font-black uppercase tracking-wider border border-[#1DB954]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                    Spotify
                  </span>
                </>
              ) : (
                <>
                  <Disc3 className="w-3.5 h-3.5 text-[#FC4C02] animate-spin" style={{ animationDuration: '3.5s' }} />
                  <span className="truncate max-w-[190px] font-semibold">{currentReel.songTitle}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#FC4C02]/20 text-[#FC4C02] font-black uppercase tracking-wider border border-[#FC4C02]/30">
                    Telifli
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Action Column (Instagram Style) */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            {/* Like */}
            <button
              onClick={() => handleToggleLike(currentReel.id)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group active:scale-125"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                  currentReel.isLiked
                    ? 'bg-rose-600/90 border-rose-500 text-white'
                    : 'bg-black/50 border-white/20 text-white group-hover:bg-black/70'
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${currentReel.isLiked ? 'fill-current' : ''}`}
                />
              </div>
              <span className="text-[11px] font-mono font-bold drop-shadow-md">
                {currentReel.likesCount}
              </span>
            </button>

            {/* Comments */}
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-black/70">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono font-bold drop-shadow-md">
                {currentReel.commentsCount}
              </span>
            </button>

            {/* Save */}
            <button
              onClick={() => handleToggleSave(currentReel.id)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                  currentReel.isSaved
                    ? 'bg-amber-500 border-amber-400 text-white'
                    : 'bg-black/50 border-white/20 text-white group-hover:bg-black/70'
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${currentReel.isSaved ? 'fill-current' : ''}`}
                />
              </div>
            </button>

            {/* Share (Paylaş İkonu ve Metni - Popüler Sosyal Platformlar) */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group active:scale-95"
              title="Popüler Sosyal Medyada Paylaş"
            >
              <div className="w-11 h-11 rounded-full bg-[#FC4C02]/20 border border-[#FC4C02]/60 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-[#FC4C02] group-hover:border-[#FC4C02] transition shadow-lg shadow-[#FC4C02]/25">
                <Share2 className="w-5 h-5 text-[#FC4C02] group-hover:text-white transition" />
              </div>
              <span className="text-[11px] font-bold text-white tracking-tight drop-shadow-md">Paylaş</span>
              <span className="text-[9px] font-mono text-zinc-300 drop-shadow-md">{currentReel.sharesCount}</span>
            </button>

            {/* Yeni Reel Ekle Quick Button (Sağ Eylem Çubuğu) */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group active:scale-95"
              title="Yeni Reel Ekle (Sürüş videosu veya galeriden)"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FC4C02] via-orange-500 to-amber-500 p-0.5 shadow-lg shadow-[#FC4C02]/30 group-hover:scale-110 transition-transform">
                <div className="w-full h-full rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-white">
                  <PlusCircle className="w-5 h-5 text-[#FC4C02] group-hover:text-white transition-colors" />
                </div>
              </div>
              <span className="text-[10px] font-black text-white tracking-tight drop-shadow-md">
                Reel Ekle
              </span>
            </button>

            {/* Spinning Vinyl Record (Instagram Reels Style) */}
            <button
              onClick={() => openAudioModal(currentReel.songTitle)}
              className="flex flex-col items-center gap-1 transition cursor-pointer group active:scale-95 mt-1"
              title="Sesi İncele / Bu Sesi Kullan"
            >
              <div className={`w-11 h-11 rounded-full p-0.5 shadow-lg ${
                currentReel.audioSourceType === 'custom_voice'
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/20'
                  : currentReel.audioSourceType === 'spotify'
                  ? 'bg-gradient-to-tr from-[#1DB954] to-emerald-400 shadow-[#1DB954]/20'
                  : 'bg-gradient-to-tr from-[#FC4C02] to-amber-400 shadow-[#FC4C02]/20'
              }`}>
                <div className="w-full h-full rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden animate-spin" style={{ animationDuration: '4s' }}>
                  {currentReel.audioSourceType === 'custom_voice' ? (
                    <Mic className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Disc3 className={`w-6 h-6 ${currentReel.audioSourceType === 'spotify' ? 'text-[#1DB954]' : 'text-[#FC4C02]'}`} />
                  )}
                </div>
              </div>
              <span className="text-[9px] font-black text-zinc-400 group-hover:text-white uppercase tracking-wider">
                {currentReel.audioSourceType === 'custom_voice' ? 'Sesim' : 'Müzik'}
              </span>
            </button>
          </div>
        </div>

        {/* Inline Delete Reel Confirmation Overlay */}
        {confirmDeleteReelId && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteReelId(null);
            }}
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-white text-[#18181B] border border-[#E2E4E9] rounded-xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#18181B]">Reel Silinsin mi?</h4>
                  <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">
                    Bu video veya fotoğraf akıştan ve profilinizden kalıcı olarak kaldırılacaktır.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteReelId(null)}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] font-bold text-xs transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteReel(confirmDeleteReelId)}
                  className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Slide-Up Comments Drawer (Instagram Style with Avatars & Interactive Notes) */}
      {isCommentsOpen && (
        <div
          onClick={() => setIsCommentsOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181D] text-white rounded-t-2xl sm:rounded-2xl border border-zinc-700/80 shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col overflow-hidden animate-slideUp"
          >
            {/* Top Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-zinc-600/80 mx-auto mt-2.5 mb-1 shrink-0" />

            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#FC4C02]" />
                <h3 className="text-sm font-black text-white">
                  Yorumlar ({currentComments.length})
                </h3>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Context Strip */}
            <div className="px-4 py-2.5 bg-black/40 border-b border-zinc-800/80 flex items-center gap-2.5">
              <img
                src={currentReel.posterUrl || currentReel.photoUrl}
                alt={currentReel.caption}
                className="w-9 h-11 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">{currentReel.riderName}</span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate">{currentReel.riderHandle}</span>
                </div>
                <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">{currentReel.caption}</p>
                <p className="text-[10px] text-[#1DB954] truncate font-medium mt-0.5">🎵 {currentReel.songTitle}</p>
              </div>
            </div>

            {/* Quick Cycling Note Suggestions */}
            <div className="px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              <span className="text-[10px] text-zinc-500 font-bold shrink-0">Hızlı Not:</span>
              {[
                'Harika tempo! 🔥',
                'Rotayı paylaşır mısın? 📍',
                'Yokuş eğimi kaçtı? ⛰️',
                'Müzik seçimi efsane! 🎵',
                'Aero duruş çok iyi 💨',
                'Kadans çok diri 🚴'
              ].map((note, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickNote(note)}
                  className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-[#FC4C02]/20 hover:text-[#FC4C02] text-zinc-300 font-medium whitespace-nowrap transition cursor-pointer shrink-0 border border-zinc-700/60 active:scale-95"
                >
                  {note}
                </button>
              ))}
            </div>

            {/* Comments List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
              {commentWarning && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs">
                  {commentWarning}
                </div>
              )}

              {currentComments.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/80 mx-auto flex items-center justify-center text-zinc-500">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Henüz yorum yapılmadı</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Bu video için ilk notu siz paylaşın!</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {['Harika sürüş! 🔥', 'Rotayı nereden çizdin? 🚴', 'Müzik seçimi çok iyi 👏'].map((pill, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickNote(pill)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                currentComments.map((c) => {
                  const isAuthor = c.isAuthor || c.userName === currentReel.riderName;

                  return (
                    <div key={c.id} className="flex items-start gap-2.5 group">
                      {/* Avatar with fallback (Click to open Rider Profile) */}
                      <div
                        onClick={() =>
                          handleOpenRiderProfile(
                            c.userName,
                            c.userHandle || `@${c.userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                            c.userAvatar
                          )
                        }
                        className="relative shrink-0 cursor-pointer group/cavatar"
                        title={`${c.userName} profilini aç`}
                      >
                        {c.userAvatar ? (
                          <img
                            src={c.userAvatar}
                            alt={c.userName}
                            className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-sm group-hover/cavatar:ring-2 group-hover/cavatar:ring-[#FC4C02] transition"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FC4C02] to-amber-500 text-white font-black text-xs flex items-center justify-center border border-white/20 shadow-sm group-hover/cavatar:ring-2 group-hover/cavatar:ring-[#FC4C02] transition">
                            {c.userName.charAt(0)}
                          </div>
                        )}
                        {isAuthor && (
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FC4C02] text-white flex items-center justify-center text-[9px] font-black border border-black shadow"
                            title="Video Sahibi"
                          >
                            👑
                          </span>
                        )}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <span
                                onClick={() =>
                                  handleOpenRiderProfile(
                                    c.userName,
                                    c.userHandle || `@${c.userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                                    c.userAvatar
                                  )
                                }
                                className="font-black text-xs text-white truncate cursor-pointer hover:text-[#FC4C02] transition-colors"
                                title={`${c.userName} profilini aç`}
                              >
                                {c.userName}
                              </span>
                              {c.userHandle && (
                                <span
                                  onClick={() =>
                                    handleOpenRiderProfile(
                                      c.userName,
                                      c.userHandle || `@${c.userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                                      c.userAvatar
                                    )
                                  }
                                  className="text-[10px] text-zinc-400 font-mono truncate cursor-pointer hover:text-white transition-colors"
                                >
                                  {c.userHandle.startsWith('@') ? c.userHandle : `@${c.userHandle}`}
                                </span>
                              )}
                              {isAuthor && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#FC4C02]/20 text-[#FC4C02] border border-[#FC4C02]/30">
                                  Yazar
                                </span>
                              )}
                              {c.badge && !isAuthor && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                              {formatCommentTime(c.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-200 leading-relaxed break-words">
                            {c.text}
                          </p>
                        </div>

                        {/* Comment Action Sub-row (Yanıtla & Beğen) */}
                        <div className="flex items-center gap-4 px-2 pt-1 text-[11px] text-zinc-400">
                          <button
                            type="button"
                            onClick={() => handleReplyToComment(c.userHandle, c.userName)}
                            className="flex items-center gap-1 font-bold hover:text-white transition cursor-pointer"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>Yanıtla</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCommentLike(c.id)}
                            className={`flex items-center gap-1 font-semibold transition cursor-pointer ${
                              c.isLiked ? 'text-rose-500' : 'hover:text-white'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${c.isLiked ? 'fill-current' : ''}`} />
                            <span className="font-mono text-[10px]">{c.likesCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Emoji Reaction Bar (Instagram Reels Style) */}
            <div className="px-4 py-1.5 bg-black/60 border-t border-zinc-800 flex items-center justify-between text-base">
              {['🔥', '🚴', '👏', '⚡', '❤️', '💨', '🚀', '💯', '⛰️', '🏆'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleQuickEmoji(emoji)}
                  className="hover:scale-125 transition-transform p-1 cursor-pointer active:scale-95"
                  title={`${emoji} tepkisi ekle`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Comment Input Form */}
            <form
              onSubmit={handleAddComment}
              className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2.5"
            >
              {/* User Avatar Thumbnail */}
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                alt="Siz"
                className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
              />

              <div className="flex-1 relative flex items-center">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Yorum veya antrenman notu yaz..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full bg-[#121215] text-xs text-white pl-3.5 pr-9 py-2.5 rounded-xl border border-zinc-700 focus:border-[#FC4C02] outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white disabled:opacity-40 transition cursor-pointer shadow-md active:scale-95 shrink-0"
                title="Yorumu Gönder"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Up Audio Sheet Modal (Telifli Müzik Bilgisi & Ses Sayfası) */}
      {isAudioSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#18181D] text-white rounded-t-2xl sm:rounded-2xl border border-zinc-700/80 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#22130e]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FC4C02]/15 border border-[#FC4C02]/30 text-[#FC4C02] flex items-center justify-center">
                  <Music className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Telifli & Lisanslı Müzik Kütüphanesi
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Instagram Reels tarzı orijinal sanatçı telifli ses kataloğu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAudioSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Active Track Highlight Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#29140c] border border-[#FC4C02]/40 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/10">
                  <img src={activeTrack.coverUrl} alt={activeTrack.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <Disc3 className="w-10 h-10 text-[#FC4C02] animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#FC4C02]/20 text-[#FC4C02] text-[10px] font-black uppercase tracking-wider border border-[#FC4C02]/30">
                      Telifli Orijinal Ses
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      {activeTrack.reelsCount} Klip
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white truncate">
                    {activeTrack.title}
                  </h4>
                  <p className="text-xs font-bold text-[#FC4C02] truncate">
                    {activeTrack.artist} • <span className="text-zinc-400 font-normal">{activeTrack.album}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic">
                    {activeTrack.copyright}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      setUploadSongTitle(activeTrack.fullTitle);
                      setIsAudioSheetOpen(false);
                      setIsUploadOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs shadow-lg shadow-[#FC4C02]/20 cursor-pointer transition shrink-0 flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Bu Sesi Kullan
                  </button>
                  <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(activeTrack.fullTitle)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1AA34A] text-black font-black text-xs shadow-md transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Spotify'da Aç
                  </a>
                </div>
              </div>

              {/* All Copyrighted Tracks List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#FC4C02]" />
                  Popüler Telifli Parçalar (Tame Impala, Loser vb.)
                </h4>

                <div className="space-y-2">
                  {COPYRIGHTED_TRACKS.map((track) => {
                    const isCurrent = activeTrack.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setActiveTrack(track)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-zinc-800/90 border-[#FC4C02]'
                            : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                            {isCurrent && (
                              <div className="absolute inset-0 bg-[#FC4C02]/40 flex items-center justify-center">
                                <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '2.5s' }} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white truncate">
                                {track.title}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FC4C02] text-white font-black uppercase">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {track.artist} • <span className="font-mono text-[10px]">{track.duration}</span>
                            </p>
                            <p className="text-[9px] text-zinc-500 truncate">
                              {track.copyright}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadSongTitle(track.fullTitle);
                            setIsAudioSheetOpen(false);
                            setIsUploadOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#FC4C02] text-zinc-200 hover:text-white text-[11px] font-bold transition shrink-0 cursor-pointer"
                        >
                          Kullan
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Sheet Modal (Popüler Sosyal Medya Platformları) */}
      {isShareModalOpen && currentReel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#18181D] text-white rounded-t-2xl sm:rounded-2xl border border-zinc-700/60 shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FC4C02]/20 border border-[#FC4C02]/40 flex items-center justify-center text-[#FC4C02]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reels'ı Paylaş</h3>
                  <p className="text-[10px] text-zinc-400">Popüler platformlarda tek tıkla paylaş</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Reel Preview Card */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
              <div className="w-14 h-18 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10">
                {currentReel.mediaType === 'image' || (!currentReel.videoUrl && currentReel.photoUrl) ? (
                  <img
                    src={currentReel.photoUrl || currentReel.posterUrl}
                    alt={currentReel.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentReel.posterUrl}
                    alt={currentReel.caption}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-[#FC4C02] text-white px-1 rounded">
                  {currentReel.mediaType === 'image' ? 'FOTO' : 'KLİP'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">{currentReel.riderName}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400">
                  <span className="truncate max-w-[170px] text-zinc-300">🎵 {currentReel.songTitle}</span>
                  {currentReel.location && (
                    <>
                      <span>•</span>
                      <span className="truncate text-zinc-400">📍 {currentReel.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Share Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-1">
                Doğrudan Paylaşım
              </span>

              {/* Instagram */}
              <button
                onClick={() => handleDirectPlatformShare('instagram')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#833ab4]/15 via-[#fd1d1d]/15 to-[#fcb045]/15 border border-[#fd1d1d]/30 hover:border-[#fd1d1d]/60 flex items-center justify-between text-left transition cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fd1d1d] to-[#fcb045] flex items-center justify-center text-white shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-[#fcb045] transition">Instagram</h4>
                    <p className="text-[10px] text-zinc-400">Hikaye veya Reels'da paylaş (Metin kopyalanır)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fd1d1d]/20 text-rose-300 border border-[#fd1d1d]/30">
                  {copiedInstagramText ? 'Kopyalandı! 🚀' : 'Paylaş'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleDirectPlatformShare('whatsapp')}
                className="w-full p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366]/60 flex items-center justify-between text-left transition cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shadow-md">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-[#25D366] transition">WhatsApp</h4>
                    <p className="text-[10px] text-zinc-400">Sohbete veya Durumuna gönder</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#25D366]/20 text-emerald-300 border border-[#25D366]/30">
                  Gönder
                </span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={() => handleDirectPlatformShare('twitter')}
                className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 flex items-center justify-between text-left transition cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shadow-md font-black text-sm">
                    𝕏
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white transition">X (Twitter)</h4>
                    <p className="text-[10px] text-zinc-400">Telemetri ve müzikle tweet at</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-zinc-200 border border-white/15">
                  Tweetle
                </span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleDirectPlatformShare('telegram')}
                className="w-full p-3 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/30 hover:border-[#229ED9]/60 flex items-center justify-between text-left transition cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shadow-md">
                    <Send className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-[#229ED9] transition">Telegram</h4>
                    <p className="text-[10px] text-zinc-400">Bisiklet grubuna veya kanalına ilet</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#229ED9]/20 text-cyan-300 border border-[#229ED9]/30">
                  İlet
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleDirectPlatformShare('facebook')}
                className="w-full p-3 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/30 hover:border-[#1877F2]/60 flex items-center justify-between text-left transition cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-md font-black text-sm">
                    f
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-[#1877F2] transition">Facebook</h4>
                    <p className="text-[10px] text-zinc-400">Zaman tünelinde ve bisiklet sayfalarında paylaş</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1877F2]/20 text-blue-300 border border-[#1877F2]/30">
                  Paylaş
                </span>
              </button>
            </div>

            {/* Quick Actions: Copy Link & Native Share */}
            <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center gap-2 text-xs font-bold text-white transition cursor-pointer"
              >
                {copiedShareLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>Bağlantıyı Kopyala</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDirectPlatformShare('native')}
                className="p-3 rounded-2xl bg-[#FC4C02] hover:bg-[#E34402] text-white flex items-center justify-center gap-2 text-xs font-black transition cursor-pointer shadow-lg shadow-[#FC4C02]/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Diğer Uygulamalar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (Instagram Reels Aynısı: Fotoğraf & Video Yükleme) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#18181D] text-white rounded-2xl border border-zinc-700/60 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FC4C02]/15 border border-[#FC4C02]/30 flex items-center justify-center text-[#FC4C02]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yeni Reel Ekle</h3>
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    Galeriden fotoğraf veya sürüş videosu paylaşın
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Source Selection Tabs: Galeri vs Kamera Kaydı vs Kayıtlı Sürüşlerim vs Hazır Klipler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setUploadSourceTab('gallery')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  uploadSourceTab === 'gallery'
                    ? 'bg-[#FC4C02] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Galeriden Seç</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab('camera')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  uploadSourceTab === 'camera'
                    ? 'bg-[#FC4C02] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Kamera Kaydı</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab('rides')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  uploadSourceTab === 'rides'
                    ? 'bg-[#FC4C02] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Sürüşlerim ({savedRidesList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSourceTab('presets')}
                className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  uploadSourceTab === 'presets'
                    ? 'bg-[#FC4C02] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Hazır Klipler</span>
              </button>
            </div>

            {/* Tab: Normal Kamera Kaydı (Canlı Yayın Olmadan) */}
            {uploadSourceTab === 'camera' && !uploadPreviewUrl && (
              <div className="space-y-2.5">
                <div className="relative aspect-[9/12] max-h-72 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  <video
                    ref={cameraVideoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? '-scale-x-100' : ''}`}
                  />

                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isCameraRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-black/70 text-zinc-200 border border-white/15'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isCameraRecording ? 'bg-white' : 'bg-[#FC4C02]'}`} />
                      {isCameraRecording
                        ? `REC ${String(Math.floor(cameraRecordSec / 60)).padStart(2, '0')}:${String(cameraRecordSec % 60).padStart(2, '0')}`
                        : 'Normal Kayıt (Yayınsız)'}
                    </span>

                    <button
                      type="button"
                      disabled={isCameraRecording}
                      onClick={() =>
                        setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                      }
                      className="p-2 rounded-full bg-black/70 text-white hover:bg-black/90 disabled:opacity-40 cursor-pointer border border-white/15"
                      title="Kamerayı Çevir"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  {!isCameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-zinc-300 gap-2 p-4 text-center">
                      <Camera className="w-7 h-7 text-[#FC4C02]" />
                      <span className="text-xs font-bold">Kamera hazırlanıyor...</span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-rose-300 gap-2 p-4 text-center">
                      <span className="text-xs font-bold">{cameraError}</span>
                      <button
                        type="button"
                        onClick={() => startReelsCamera(cameraFacingMode)}
                        className="px-3 py-1.5 rounded-lg bg-[#FC4C02] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tekrar Dene</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {!isCameraRecording ? (
                    <>
                      <button
                        type="button"
                        disabled={!isCameraActive}
                        onClick={captureCameraPhoto}
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <Camera className="w-4 h-4 text-[#FC4C02]" />
                        <span>Fotoğraf Çek</span>
                      </button>
                      <button
                        type="button"
                        disabled={!isCameraActive}
                        onClick={startCameraVideoRecording}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FC4C02] hover:bg-[#E04300] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <Video className="w-4 h-4" />
                        <span>Video Kaydını Başlat</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCameraVideoRecording}
                      className="sm:col-span-2 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Kaydı Bitir ve Önizle ({cameraRecordSec} sn)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 1: Galeri / Cihazdan Dosya Seçimi */}
            {uploadSourceTab === 'gallery' && (
              <div className="space-y-3">
                {/* Media Type Toggle: Fotoğraf Reels vs Video Klip */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setUploadMediaType('image')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadMediaType === 'image'
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Fotoğraf</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMediaType('video')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadMediaType === 'video'
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Video Klip</span>
                  </button>
                </div>

                {/* Dropzone */}
                {!uploadPreviewUrl && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-[#FC4C02] rounded-xl p-6 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-zinc-900/80 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/30 text-[#FC4C02] flex items-center justify-center mx-auto mb-2 transition">
                      {uploadMediaType === 'image' ? (
                        <ImageIcon className="w-6 h-6" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-[#FC4C02] transition">
                      {uploadMediaType === 'image'
                        ? 'Galerinizden Fotoğraf Seçin'
                        : 'Galerinizden veya Cihazınızdan Video Klip Seçin'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {uploadMediaType === 'image'
                        ? 'JPG, PNG, WebP formatındaki fotoğraflar Reels akışına kaydedilir'
                        : 'MP4, MOV, WebM formatında dikey bisiklet videosu'}
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-800 group-hover:bg-[#FC4C02] text-white text-[11px] font-semibold transition inline-flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadMediaType === 'image' ? 'Fotoğraf Seç' : 'Dosyalara Göz At'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Kayıtlı Sürüşlerimden Klip Oluştur */}
            {uploadSourceTab === 'rides' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Tamamlanan Sürüşlerinizi Seçin</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Veriler otomatik aktarılır</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedRidesList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-center space-y-1">
                      <p className="text-xs font-bold text-zinc-200">Henüz kayıtlı sürüşünüz yok</p>
                      <p className="text-[11px] text-zinc-400">
                        GPS ile bir sürüş kaydettiğinizde burada gerçek verilerinizle görünür.
                      </p>
                    </div>
                  ) : (
                    savedRidesList.map((ride) => {
                      const isSelected = selectedRideId === ride.id;
                      return (
                        <div
                          key={ride.id}
                          onClick={() => handleSelectSavedRide(ride)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#FC4C02]/15 border-[#FC4C02] text-white'
                              : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{ride.title}</span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#FC4C02]" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                              <span>{ride.distanceKm} km</span>
                              <span>•</span>
                              <span>{ride.avgSpeedKmH || 0} km/s</span>
                              <span>•</span>
                              <span className="text-[#FC4C02]">+{ride.climbM || 0}m</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                            {isSelected ? 'Seçildi' : 'Kullan'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#FC4C02] shrink-0" />
                  <span>Sürüş seçtikten sonra galerinizden fotoğraf veya video yükleyebilir ya da hazır kliplerden birini kullanabilirsiniz.</span>
                </div>
              </div>
            )}

            {/* Tab 3: Hazır Sürüş Videoları */}
            {uploadSourceTab === 'presets' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Örnek Bisiklet Sürüş Klipleri</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Tek dokunuşla seç</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {PRESET_CYCLING_VIDEOS.map((preset) => {
                    const isSelected = uploadPreviewUrl === preset.videoUrl;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPresetVideo(preset)}
                        className={`relative aspect-[16/10] rounded-xl overflow-hidden border cursor-pointer group transition ${
                          isSelected
                            ? 'border-[#FC4C02] ring-2 ring-[#FC4C02]/40 shadow-lg'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={preset.posterUrl}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white border border-white/20">
                            {preset.category}
                          </span>
                        </div>
                        <div className="absolute bottom-1.5 inset-x-1.5">
                          <p className="text-[10px] font-bold text-white line-clamp-1">{preset.title}</p>
                          <span className="text-[9px] text-[#FC4C02] font-mono font-bold">{preset.speed} km/s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real File Input for device gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept={uploadMediaType === 'image' ? 'image/*' : 'video/*,image/*'}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Active Video / Photo Preview Card (Interactive) */}
            {uploadPreviewUrl && (
              <div className="relative rounded-2xl border border-[#FC4C02]/50 bg-black/80 p-3.5 overflow-hidden flex items-start gap-3.5 shadow-lg">
                <div className="w-24 h-36 rounded-xl overflow-hidden bg-zinc-900 relative shrink-0 border border-white/20 shadow-md">
                  {uploadMediaType === 'image' ? (
                    <img src={uploadPreviewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                  ) : (
                    <video
                      src={uploadPreviewUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-1 right-1 text-[8px] font-black bg-[#FC4C02] text-white px-1.5 py-0.5 rounded uppercase">
                    {uploadMediaType === 'image' ? 'Foto' : 'Video'}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      {uploadFile ? 'Galeriden Medya Yüklendi' : 'Sürüş Videosu Hazır'}
                    </span>
                  </div>

                  <p className="text-xs text-white font-bold truncate">
                    {uploadFile?.name || 'Seçili Sürüş Klibi'}
                  </p>

                  <p className="text-[10px] text-zinc-400 font-mono">
                    {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1080x1920 • 60 FPS'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Galeriden Değiştir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreviewUrl('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold hover:bg-rose-500/30 cursor-pointer transition"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* Rider Name */}
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400 block mb-1">
                  Sporcu Adı
                </label>
                <input
                  type="text"
                  placeholder="Adınız veya Kulübünüz"
                  value={uploadRiderName}
                  onChange={(e) => setUploadRiderName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-[#FC4C02]"
                  required
                />
              </div>

              {/* Reels Sesi / Müzik Seçimi: Spotify API & Kendi Sesim */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Reels Müziği veya Kendi Sesin *</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">Spotify API & Mikrofon</span>
                </div>

                {/* Switcher: Spotify vs Kendi Sesim */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setUploadAudioType('spotify')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadAudioType === 'spotify'
                        ? 'bg-[#1DB954] text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>🎧 Spotify & Müzik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadAudioType('custom_voice')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadAudioType === 'custom_voice'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>🎙️ Kendi Sesim / Ses Kaydı</span>
                  </button>
                </div>

                {/* Spotify Web API Music Section */}
                {uploadAudioType === 'spotify' && (
                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#1DB954] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                        Spotify Web API (Client ID: eff4bf4d...)
                      </span>
                      <span className="text-zinc-400">Canlı Arama & Önizleme</span>
                    </div>

                    {/* Spotify Live Search Bar with Enter key & explicit Ara button */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={spotifySearchQuery}
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                performSpotifySearch(spotifySearchQuery);
                              }
                            }}
                            placeholder="Şarkı veya sanatçı ara (Tame Impala, Duman, Loser, Dua Lipa...)"
                            className="w-full pl-9 pr-8 py-2.5 bg-black/70 border border-zinc-700 focus:border-[#1DB954] rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition"
                          />
                          {spotifySearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSpotifySearchQuery('');
                                performSpotifySearch('');
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                              title="Temizle"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => performSpotifySearch(spotifySearchQuery)}
                          disabled={isSearchingSpotify}
                          className="px-3.5 py-2.5 bg-[#1DB954] hover:bg-[#1AA34A] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {isSearchingSpotify ? (
                            <Disc3 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          <span>Ara</span>
                        </button>
                      </div>

                      {/* Quick Music Suggestion Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                        <span className="text-[10px] text-zinc-500 font-bold shrink-0">Öneriler:</span>
                        {[
                          'Tame Impala',
                          'Beck - Loser',
                          'Duman',
                          'Mor ve Ötesi',
                          'The Weeknd',
                          'Dua Lipa',
                          'Daft Punk'
                        ].map((chip) => (
                          <button
                            type="button"
                            key={chip}
                            onClick={() => {
                              setSpotifySearchQuery(chip);
                              performSpotifySearch(chip);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-[#1DB954]/20 hover:text-[#1DB954] text-zinc-300 font-medium whitespace-nowrap transition cursor-pointer shrink-0 border border-zinc-700/60"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Spotify Track Card */}
                    {selectedSpotifyTrack && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#1DB954]/20 via-[#1DB954]/10 to-transparent border border-[#1DB954]/40 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={selectedSpotifyTrack.albumCover}
                            alt={selectedSpotifyTrack.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/20 shadow-md"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-white truncate">{selectedSpotifyTrack.name}</p>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#1DB954] text-black shrink-0">
                                Seçildi ✓
                              </span>
                            </div>
                            <p className="text-[11px] text-[#1DB954] font-semibold truncate">{selectedSpotifyTrack.artist}</p>
                          </div>
                        </div>

                        {selectedSpotifyTrack.previewUrl && (
                          <button
                            type="button"
                            onClick={(e) => toggleTrackPreview(e, selectedSpotifyTrack)}
                            className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black text-white font-bold text-[10px] flex items-center gap-1.5 border border-white/10 shrink-0 transition"
                            title="Önizlemeyi Dinle"
                          >
                            {previewingTrackId === selectedSpotifyTrack.id ? (
                              <>
                                <Pause className="w-3.5 h-3.5 text-[#1DB954] animate-pulse" />
                                <span className="text-[#1DB954]">Durdur</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 text-white" />
                                <span>Dinle</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Spotify Tracks Carousel / Grid */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-zinc-300">
                          {isSearchingSpotify ? 'Müzikler aranıyor...' : `Müzik Listesi (${spotifyTracks.length})`}
                        </span>
                        {spotifySearchQuery && (
                          <button
                            type="button"
                            onClick={() => handleUseQueryAsCustomTrack()}
                            className="text-[10px] text-[#1DB954] hover:underline font-bold cursor-pointer"
                          >
                            + "{spotifySearchQuery}" olarak belirle
                          </button>
                        )}
                      </div>

                      {spotifyTracks.length === 0 && !isSearchingSpotify ? (
                        <div className="p-4 rounded-xl bg-black/50 border border-zinc-800 text-center space-y-2">
                          <p className="text-xs text-zinc-400">
                            "{spotifySearchQuery}" için parça bulunamadı.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleUseQueryAsCustomTrack()}
                            className="px-3 py-1.5 bg-[#1DB954] text-black font-black text-xs rounded-xl transition hover:bg-[#1AA34A]"
                          >
                            "{spotifySearchQuery}" Adını Klipte Kullan
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 bg-black/40 rounded-xl border border-zinc-800/80">
                          {spotifyTracks.map((track) => {
                            const isSelected = selectedSpotifyTrack?.id === track.id || uploadSongTitle === `${track.artist} - ${track.name}`;
                            const isPreviewing = previewingTrackId === track.id;

                            return (
                              <div
                                key={track.id}
                                onClick={() => handleSelectTrack(track)}
                                className={`p-2 rounded-xl text-left border transition flex items-center justify-between gap-2 cursor-pointer group ${
                                  isSelected
                                    ? 'bg-[#1DB954]/20 border-[#1DB954] text-white'
                                    : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/70'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="relative shrink-0">
                                    <img
                                      src={track.albumCover}
                                      alt={track.name}
                                      className="w-9 h-9 rounded-lg object-cover"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-[#1DB954]/30 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold truncate leading-tight group-hover:text-white">
                                      {track.name}
                                    </p>
                                    <p className="text-[9px] text-[#1DB954] truncate font-medium">
                                      {track.artist}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {track.previewUrl && (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleTrackPreview(e, track)}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
                                        isPreviewing
                                          ? 'bg-[#1DB954] text-black border-[#1DB954]'
                                          : 'bg-black/60 hover:bg-black text-zinc-300 border-zinc-700'
                                      }`}
                                      title={isPreviewing ? 'Durdur' : '30s Önizleme Çal'}
                                    >
                                      {isPreviewing ? (
                                        <Pause className="w-3.5 h-3.5" />
                                      ) : (
                                        <Play className="w-3.5 h-3.5 ml-0.5" />
                                      )}
                                    </button>
                                  )}
                                  <span className="text-[9px] font-mono text-zinc-400">
                                    {track.durationFormatted}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Manual Song Title Input with Apply Button */}
                    <div className="pt-1">
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                        Veya Şarkı / Parça Adını Doğrudan Belirleyin:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={uploadSongTitle}
                          onChange={(e) => setUploadSongTitle(e.target.value)}
                          placeholder="Örn: Mor ve Ötesi - Cambaz veya Tame Impala - Borderline"
                          className="flex-1 px-3 py-2 bg-black/60 border border-zinc-700 focus:border-[#1DB954] rounded-xl text-xs text-white outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (uploadSongTitle.trim()) {
                              handleUseQueryAsCustomTrack(uploadSongTitle.trim());
                            }
                          }}
                          className="px-3 py-2 bg-zinc-800 hover:bg-[#1DB954] hover:text-black text-zinc-300 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer border border-zinc-700"
                        >
                          Uygula
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kendi Sesim / Orijinal Ses Section */}
                {uploadAudioType === 'custom_voice' && (
                  <div className="p-3 bg-zinc-900/80 rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        Kendi Sesini Ekle (Canlı Kayıt veya Ses Dosyası)
                      </span>
                      <span className="text-zinc-400">Orijinal Ses</span>
                    </div>

                    {/* Live Recording Area */}
                    <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 flex flex-col items-center justify-center text-center">
                      {isRecordingVoice ? (
                        <div className="py-2 space-y-2.5 w-full">
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-xs font-black text-rose-400">
                              Sesiniz Kaydediliyor: 00:{recordingDurationSec < 10 ? '0' : ''}{recordingDurationSec} / 01:00
                            </span>
                          </div>
                          {/* Animated sound wave bars */}
                          <div className="flex items-center justify-center gap-1 h-6">
                            {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 60].map((h, i) => (
                              <span
                                key={i}
                                className="w-1 bg-amber-400 rounded-full animate-pulse"
                                style={{
                                  height: `${h}%`,
                                  animationDelay: `${i * 0.08}s`
                                }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="mt-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer transition mx-auto"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Kaydı Bitir & Kullan</span>
                          </button>
                        </div>
                      ) : customVoiceUrl ? (
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Orijinal Ses Hazır ({customVoiceFile?.name || 'Kayıt'})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomVoiceUrl('');
                                setCustomVoiceFile(null);
                              }}
                              className="text-[10px] text-zinc-400 hover:text-rose-400 cursor-pointer"
                            >
                              Kaldır
                            </button>
                          </div>
                          {/* Audio player preview */}
                          <audio src={customVoiceUrl} controls className="w-full h-8 rounded-lg" />
                          <button
                            type="button"
                            onClick={startVoiceRecording}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Mic className="w-3 h-3 text-amber-400" />
                            <span>Yeniden Kaydet</span>
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 space-y-2 w-full">
                          <p className="text-xs text-zinc-300 font-semibold">
                            Mikrofonla konuşmanı, sprint tepkini veya sürüş anlatımını kaydet
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={startVoiceRecording}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Mikrofonla Kaydet</span>
                            </button>
                            <span className="text-[11px] text-zinc-500 font-bold">veya</span>
                            <button
                              type="button"
                              onClick={() => voiceFileInputRef.current?.click()}
                              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                            >
                              <Upload className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ses Dosyası Yükle</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hidden file input for audio files */}
                    <input
                      ref={voiceFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                      onChange={handleCustomVoiceFileSelect}
                      className="hidden"
                    />

                    {/* Voice Title */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                        Ses Başlığı (Örn: "Orijinal Ses - İniş & Rüzgar Sesi")
                      </label>
                      <input
                        type="text"
                        value={customVoiceTitle}
                        onChange={(e) => setCustomVoiceTitle(e.target.value)}
                        placeholder="Orijinal Ses - [Başlığınız]"
                        className="w-full px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Telemetry HUD Option (Hız, Watt, Eğim) */}
              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTelemetry}
                      onChange={(e) => setIncludeTelemetry(e.target.checked)}
                      className="accent-[#FC4C02] rounded w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Sürüş Telemetrisi (Hız, Güç, Eğim)</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#FC4C02] font-black">
                    {includeTelemetry ? 'AKTİF' : 'KAPALI'}
                  </span>
                </div>

                {includeTelemetry && (
                  <div className="grid grid-cols-3 gap-2 pt-1 animate-fadeIn">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Hız (km/s)</span>
                      <input
                        type="text"
                        value={uploadSpeed}
                        onChange={(e) => setUploadSpeed(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-white font-mono outline-none focus:border-[#FC4C02]"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Güç (Watt)</span>
                      <input
                        type="text"
                        value={uploadWatts}
                        onChange={(e) => setUploadWatts(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-white font-mono outline-none focus:border-[#FC4C02]"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Eğim (%)</span>
                      <input
                        type="text"
                        value={uploadGradient}
                        onChange={(e) => setUploadGradient(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-white font-mono outline-none focus:border-[#FC4C02]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase text-zinc-400">
                    Reels Açıklaması & Başlık
                  </label>
                  <span className="text-[10px] text-zinc-500">Zorunlu</span>
                </div>
                <textarea
                  rows={2}
                  placeholder={
                    uploadMediaType === 'image'
                      ? 'Bu fotoğraf nerede çekildi? Örneğin: Çamlıca yokuşu gün batımı...'
                      : 'Bugünkü sürüşten bir an, sprint veya iniş...'
                  }
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-[#FC4C02]"
                  required
                />
                {/* Hashtag Chips */}
                <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {['#peloton', '#sürüş', '#tırmanış', '#sprint', '#aero', '#kadans', '#gravel', '#yolbisikleti'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setUploadCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-[#FC4C02]/20 hover:text-[#FC4C02] text-zinc-400 text-[10px] font-mono transition cursor-pointer shrink-0"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400 block mb-1">
                  Konum
                </label>
                <input
                  type="text"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-[#FC4C02]"
                />
                <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                  {['Caddebostan Sahili', 'Bebek Sahili', 'Kartepe Zirvesi', 'Belgrad Ormanı', 'Stelvio Geçidi'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setUploadLocation(loc)}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition cursor-pointer shrink-0"
                    >
                      📍 {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#FC4C02] hover:bg-[#E34402] text-white cursor-pointer transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni Reel&apos;i Yayınla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-[#FC4C02]/40 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-[#FC4C02]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Rider Profile & Reels Modal (Reels'ta profile tıklayınca açılan profil) */}
      <ReelRiderProfileModal
        rider={selectedRiderProfile}
        isOpen={isRiderProfileOpen}
        onClose={() => setIsRiderProfileOpen(false)}
        onSelectReel={handleSelectReelFromProfile}
        onStartChat={(riderName) => {
          if (onStartPrivateChat && selectedRiderProfile) {
            onStartPrivateChat({
              userId: 'reel-' + selectedRiderProfile.handle.replace(/[^a-zA-Z0-9_-]/g, ''),
              userName: riderName,
              userAvatar: selectedRiderProfile.avatar
            });
          }
        }}
      />
    </div>
  );
};
