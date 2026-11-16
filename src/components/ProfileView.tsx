import React, { useState } from 'react';
import {
  Bike,
  Download,
  Edit2,
  Check,
  CheckCircle2,
  Heart,
  Flame,
  BarChart2,
  Key,
  Film,
  Play,
  Eye,
  MessageCircle,
  PlusCircle,
  X,
  Disc3,
  Camera,
  Volume2,
  VolumeX,
  Compass,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { SavedRide, RiderProfile, GoogleUserProfile, PersistedUserBadge } from '../types';
import { CyclingReel } from '../types/reels';
import { socketService } from '../services/socket';
import { calculateUserRank } from '../utils/rankings';
import { garminService } from '../services/garminService';
import { apiKeyService, ApiKeyServiceConfig } from '../services/apiKeyService';
import { reelsService } from '../services/reelsService';
import { RideStatsDetailModal } from './RideStatsDetailModal';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { BadgesShowcase } from './BadgesShowcase';

interface ProfileViewProps {
  savedRides: SavedRide[];
  persistedBadges?: PersistedUserBadge[];
  googleUser: GoogleUserProfile | null;
  profileBio?: string;
  profileFtpWatts?: number;
  profileWeightKg?: number;
  onUpdateProfile?: (updates: {
    displayName?: string;
    bio?: string;
    ftpWatts?: number;
    weightKg?: number;
  }) => void;
  onOpenGoogleAuth: () => void;
  onOpenLeaderboard: () => void;
  onExportGpx: (ride: SavedRide) => void;
  onOpenGarmin?: () => void;
  onOpenApiManagement?: () => void;
  onNavigateToReels?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  savedRides,
  persistedBadges = [],
  googleUser,
  profileBio,
  profileFtpWatts,
  profileWeightKg,
  onUpdateProfile,
  onOpenGoogleAuth,
  onOpenLeaderboard,
  onExportGpx,
  onOpenGarmin,
  onOpenApiManagement,
  onNavigateToReels,
}) => {
  const [garminState, setGarminState] = useState(garminService.getState());
  const [apiKeys, setApiKeys] = useState<ApiKeyServiceConfig[]>(apiKeyService.getKeys());
  const activeUserName = googleUser?.name || socketService.getUser().name || 'Bisikletçi';
  const profileStorageKey = googleUser?.id ? `pel_rider_profile_${googleUser.id}` : 'pel_rider_profile_guest';

  // My Reels (Paylaştığım Reels'lar / Kliplerim)
  const [myReels, setMyReels] = useState<CyclingReel[]>(() =>
    reelsService.getMyReels(activeUserName)
  );
  const [previewReel, setPreviewReel] = useState<CyclingReel | null>(null);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [confirmDeleteReelId, setConfirmDeleteReelId] = useState<string | null>(null);

  React.useEffect(() => {
    const unsub = garminService.subscribe((s) => setGarminState(s));
    const unsubApi = apiKeyService.subscribe((k) => setApiKeys(k));
    const unsubReels = reelsService.subscribe(() => {
      setMyReels(reelsService.getMyReels(activeUserName));
    });
    return () => {
      unsub();
      unsubApi();
      unsubReels();
    };
  }, [activeUserName]);

  const [profile, setProfile] = useState<RiderProfile>(() => {
    const saved = localStorage.getItem(profileStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    const user = socketService.getUser();
    return {
      name: googleUser?.name || user.name || 'Bisikletçi',
      email: googleUser?.email || '',
      bio: profileBio || 'Yol · Gravel · Dağ Bisikleti',
      level: 1,
      ftpWatts: profileFtpWatts ?? 220,
      weightKg: profileWeightKg ?? 72,
      bikes: [
        { id: 'b1', name: 'Gravel Bisikletim', brand: 'Gravel', type: 'Gravel', mileageKm: 0 },
        { id: 'b2', name: 'Yol Bisikletim', brand: 'Road', type: 'Road', mileageKm: 0 },
      ],
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRideForStats, setSelectedRideForStats] = useState<SavedRide | null>(null);
  const [editName, setEditName] = useState(googleUser?.name || profile.name);
  const [editBio, setEditBio] = useState(profileBio || profile.bio);
  const [editFtp, setEditFtp] = useState(String(profileFtpWatts ?? profile.ftpWatts));
  const [editWeight, setEditWeight] = useState(String(profileWeightKg ?? profile.weightKg));

  React.useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: googleUser?.name || prev.name,
      email: googleUser?.email || prev.email,
      bio: profileBio ?? prev.bio,
      ftpWatts: profileFtpWatts ?? prev.ftpWatts,
      weightKg: profileWeightKg ?? prev.weightKg,
    }));
    setEditName(googleUser?.name || profile.name);
    if (profileBio !== undefined) setEditBio(profileBio);
    if (profileFtpWatts !== undefined) setEditFtp(String(profileFtpWatts));
    if (profileWeightKg !== undefined) setEditWeight(String(profileWeightKg));
  }, [googleUser?.id, googleUser?.name, googleUser?.email, profileBio, profileFtpWatts, profileWeightKg]);

  const totalKm = savedRides.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalClimb = savedRides.reduce((acc, r) => acc + r.climbM, 0);

  const rank = calculateUserRank({
    totalDistanceKm: totalKm,
    totalClimbM: totalClimb,
    ftpWatts: profile.ftpWatts,
    ridesCount: savedRides.length,
  });

  const saveProfile = () => {
    const updated: RiderProfile = {
      ...profile,
      name: editName.trim() || profile.name,
      bio: editBio.trim() || profile.bio,
      ftpWatts: parseInt(editFtp) || 200,
      weightKg: parseInt(editWeight) || 70,
    };
    setProfile(updated);
    localStorage.setItem(profileStorageKey, JSON.stringify(updated));
    socketService.setUserName(updated.name);
    onUpdateProfile?.({
      displayName: updated.name,
      bio: updated.bio,
      ftpWatts: updated.ftpWatts,
      weightKg: updated.weightKg,
    });
    setIsEditing(false);
  };

  const wattsPerKg = (profile.ftpWatts / (profile.weightKg || 1)).toFixed(2);

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedRides, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `pel_aktivite_yedegi_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full min-w-0 bg-[#F4F5F7] text-[#18181B] overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white border border-[#E2E4E9] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {googleUser?.photoUrl ? (
              <img
                src={googleUser.photoUrl}
                alt={googleUser.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#E2E4E9] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#FC4C02] text-white flex items-center justify-center text-xl font-bold shrink-0">
                {(googleUser?.name || profile.name).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-[#F8F9FA] text-sm font-bold text-[#18181B] px-2.5 py-1 rounded-lg border border-[#E2E4E9] outline-none focus:border-[#FC4C02]"
                    placeholder="Adınız"
                  />
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="bg-[#F8F9FA] text-xs text-[#52525B] px-2.5 py-1 rounded-lg border border-[#E2E4E9] outline-none block focus:border-[#FC4C02]"
                    placeholder="Biyografi"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#18181B]">
                      {googleUser?.name || profile.name}
                    </h2>
                    {googleUser && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FC4C02]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FC4C02]" />
                        Doğrulandı
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A]">
                    {googleUser?.email || profile.email}
                  </p>
                  <p className="text-xs text-[#52525B] mt-0.5">{profile.bio}</p>

                  <div className="flex items-center gap-2 mt-2 text-[11px]">
                    <span className="font-mono font-bold uppercase text-[#18181B]">
                      {rank.division.name} · {rank.points.toLocaleString('tr-TR')} RP
                    </span>
                    <button
                      onClick={onOpenLeaderboard}
                      className="font-semibold text-[#FC4C02] hover:underline cursor-pointer"
                    >
                      Sıralamayı Gör
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={saveProfile}
                className="px-4 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#333333] font-bold text-xs border border-[#E5E5EB] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Düzenle</span>
              </button>
            )}

            <button
              onClick={onOpenGoogleAuth}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#F4F5F7] text-[#18181B] font-bold text-xs border border-[#E2E4E9] flex items-center gap-1.5 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{googleUser ? 'Hesap Ayarları' : 'Oturum Aç'}</span>
            </button>
          </div>
        </div>

        {/* FTP & Performance Metric Strip */}
        <div className="grid grid-cols-3 divide-x divide-[#ECEEF2] mt-5 pt-4 border-t border-[#ECEEF2] text-center">
          <div className="px-2">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">FTP Gücü</span>
            <strong className="text-base sm:text-lg font-bold font-mono text-[#FC4C02]">
              {profile.ftpWatts} <small className="text-[10px] text-[#71717A]">W</small>
            </strong>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Güç / Ağırlık</span>
            <strong className="text-base sm:text-lg font-bold font-mono text-[#18181B]">
              {wattsPerKg} <small className="text-[10px] text-[#71717A]">w/kg</small>
            </strong>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Lig Puanı</span>
            <strong className="text-base sm:text-lg font-bold font-mono text-[#18181B]">
              {rank.points} <small className="text-[10px] text-[#FC4C02]">RP</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Son 7 Günlük Sürüş Mesafesi Grafiği (Recharts) */}
      <WeeklyActivityChart savedRides={savedRides} />

      {/* Başarı & Milestone Rozetleri */}
      <BadgesShowcase savedRides={savedRides} persistedBadges={persistedBadges} />

      {/* Garmin Connect Integration Card */}
      <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007AC2] flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L3 18h18L12 2zm0 4.2L17.5 15H6.5L12 6.2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                  Garmin Connect™ Entegrasyonu
                </h3>
                <span className={`text-[11px] font-semibold ${
                  garminState.isConnected ? 'text-emerald-600' : 'text-[#71717A]'
                }`}>
                  · {garminState.isConnected ? 'Bağlı' : 'Bağlı Değil'}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Garmin Edge, HRM-Pro &amp; Varia Radar telemetri senkronizasyonu
              </p>
            </div>
          </div>

          {onOpenGarmin && (
            <button
              onClick={onOpenGarmin}
              className="px-3.5 py-1.5 rounded-lg bg-[#007AC2] hover:bg-[#0066A3] text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>{garminState.isConnected ? 'Yönet ve Eşitle' : 'Garmin Hesabı Bağla'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] mt-3 pt-1">
          <div className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Hesap Durumu</span>
            <span className="font-mono text-xs font-bold text-[#007AC2] truncate block mt-0.5">
              {garminState.isConnected ? (garminState.displayName || 'Garmin Bağlı') : 'Henüz bağlanmadı'}
            </span>
          </div>

          <div className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Eşleşmiş Cihazlar</span>
            <span className="text-xs font-semibold text-[#18181B] block mt-0.5">
              {garminState.devices.length > 0 ? `${garminState.devices.length} Cihaz Eşli` : 'Cihaz yok'}
            </span>
          </div>

          <div className="p-2.5">
            <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Otomatik Bulut Senkronu</span>
            <span className="text-xs font-semibold text-[#71717A] flex items-center gap-1 mt-0.5">
              {garminState.autoUploadRides ? 'Sürüş Bitiminde Aktar' : 'Kapalı'}
            </span>
          </div>
        </div>
      </div>

      {/* 3x API & Telemetry Services Card */}
      <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center text-[#FC4C02] shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                  API ve Telemetri Servisleri
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600">
                  · {apiKeys.length} Servis Aktif
                </span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Bisiklet yönlendirme, canlı rüzgar/aero ve irtifa eğim profili motorları
              </p>
            </div>
          </div>

          {onOpenApiManagement && (
            <button
              onClick={onOpenApiManagement}
              className="px-3.5 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Yönet ve Test Et</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] mt-3 pt-1">
          {apiKeys.map((k) => (
            <div key={k.id} className="p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-[#71717A]">{k.roleLabel}</span>
                <span className="text-[10px] font-mono font-bold text-emerald-600">
                  {k.lastPingMs}ms
                </span>
              </div>
              <strong className="text-xs font-bold text-[#18181B] block truncate mt-0.5" title={k.name}>
                {k.name}
              </strong>
              <span className="font-mono text-[10px] text-[#71717A] block truncate mt-0.5">
                {k.key.slice(0, 10)}...{k.key.slice(-8)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bike Garage */}
      <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#F0F0F4] pb-2">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-[#FC4C02]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242428]">
              Bisiklet Garajı
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.bikes.map((bike) => (
            <div
              key={bike.id}
              className="p-3.5 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] flex items-center justify-between"
            >
              <div>
                <strong className="text-xs font-bold text-[#242428] block">{bike.name}</strong>
                <span className="text-[11px] text-[#6B7280]">
                  {bike.brand} · {bike.type}
                </span>
                <span className="text-[10px] font-mono text-[#FC4C02] block mt-1 font-bold">
                  {bike.mileageKm} km toplam mesafe
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#FC4C02]/10 text-[#FC4C02]">
                {bike.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Paylaştığım Reels'lar (Kliplerim) */}
      <div className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center text-[#FC4C02] shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                  Paylaştığım Reels&apos;lar
                </h3>
                <span className="text-[11px] font-semibold text-[#FC4C02]">
                  · {myReels.length} Klip
                </span>
              </div>
              <p className="text-[11px] text-[#71717A]">
                Profilinizde yayınlanan dikey bisiklet antrenman videoları ve fotoğrafları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToReels && (
              <button
                onClick={onNavigateToReels}
                className="px-3.5 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Yeni Reels Paylaş</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        {myReels.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-[#ECEEF2] mt-3 pt-1 text-center">
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Görüntülenme</span>
              <strong className="text-sm sm:text-base font-bold font-mono text-[#18181B]">
                {myReels.reduce((acc, r) => acc + (r.viewsCount || r.likesCount * 6 + 120), 0).toLocaleString('tr-TR')}
              </strong>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Beğeni</span>
              <strong className="text-sm sm:text-base font-bold font-mono text-rose-500 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {myReels.reduce((acc, r) => acc + (r.likesCount || 0), 0).toLocaleString('tr-TR')}
              </strong>
            </div>
            <div className="p-2.5">
              <span className="text-[10px] uppercase font-semibold text-[#71717A] block">Yorum</span>
              <strong className="text-sm sm:text-base font-bold font-mono text-[#FC4C02] flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {myReels.reduce((acc, r) => acc + (r.commentsCount || 0), 0)}
              </strong>
            </div>
          </div>
        )}

        {/* Reels 9:16 Grid */}
        <div className="mt-4">
          {myReels.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 text-[#FC4C02] flex items-center justify-center mx-auto">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#242428]">Henüz Reels Klibi Paylaşmadınız</h4>
                <p className="text-[11px] text-[#6B7280] max-w-sm mx-auto mt-0.5">
                  Antrenman, iniş veya sprint anlarınızı Spotify müziği veya kendi sesinizle dikey Reels olarak paylaşın.
                </p>
              </div>
              {onNavigateToReels && (
                <button
                  onClick={onNavigateToReels}
                  className="px-4 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>İlk Reels Klibini Paylaş</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {myReels.map((reel) => {
                const isImage = reel.mediaType === 'image' || (!reel.videoUrl && !!reel.photoUrl);
                const views = reel.viewsCount || (reel.likesCount * 6 + 120);

                return (
                  <div
                    key={reel.id}
                    onClick={() => setPreviewReel(reel)}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-[#E5E5EB] hover:border-[#FC4C02] shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    {/* Poster image */}
                    <img
                      src={reel.posterUrl || reel.photoUrl}
                      alt={reel.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Badges & Delete Trigger */}
                    <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-bold text-white flex items-center gap-1">
                        {isImage ? (
                          <>
                            <Camera className="w-2.5 h-2.5 text-amber-400" />
                            <span>Foto</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-2.5 h-2.5 text-[#FC4C02]" />
                            <span>Reel</span>
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteReelId(reel.id);
                        }}
                        className="w-7 h-7 rounded-full bg-black/65 hover:bg-rose-600 text-white border border-white/20 flex items-center justify-center transition cursor-pointer"
                        title="Reel'i Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-[#FC4C02]/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-2 inset-x-2 z-10 space-y-1">
                      <p className="text-[10px] text-white font-medium line-clamp-1 leading-tight drop-shadow">
                        {reel.caption}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                        <span className="flex items-center gap-1 text-white font-bold">
                          <Eye className="w-3 h-3 text-zinc-400" />
                          {views > 1000 ? `${(views / 1000).toFixed(1)}K` : views}
                        </span>
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          {reel.likesCount}
                        </span>
                      </div>

                      {reel.songTitle && (
                        <div className="flex items-center gap-1 text-[9px] text-[#1DB954] truncate">
                          <Disc3 className="w-2.5 h-2.5 animate-spin" />
                          <span className="truncate">{reel.songTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ride History */}
      <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#F0F0F4] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242428]">
            Aktivite Geçmişi ({savedRides.length})
          </h3>
          <button
            onClick={handleExportAll}
            className="text-xs font-bold text-[#FC4C02] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tümünü Yedekle</span>
          </button>
        </div>

        {savedRides.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#6B7280]">
            Henüz kaydedilmiş aktivite yok. "Kaydet" sekmesinden GPS kaydına başlayabilirsiniz.
          </div>
        ) : (
          <div className="space-y-2">
            {savedRides.map((ride) => (
              <div
                key={ride.id}
                onClick={() => setSelectedRideForStats(ride)}
                className="p-3.5 rounded-xl bg-[#F8F9FA] hover:bg-white border border-[#E2E4E9] hover:border-[#FC4C02]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#242428] group-hover:text-[#FC4C02] transition">
                      {ride.title}
                    </h4>
                    <span className="text-[10px] text-[#6B7280] flex items-center gap-0.5">
                      <BarChart2 className="w-3 h-3 text-[#FC4C02]" />
                      Detay
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-[#6B7280] font-mono mt-1 flex-wrap">
                    <span>{ride.distanceKm} km</span>
                    <span>•</span>
                    <span>{Math.floor(ride.durationSec / 60)} dk</span>
                    <span>•</span>
                    <span className="text-[#FC4C02] font-bold">+{ride.climbM}m</span>
                    <span>•</span>
                    <span className="text-red-500 flex items-center gap-0.5 font-bold">
                      <Heart className="w-3 h-3 fill-current" />
                      {ride.avgHeartRate || 145} bpm
                    </span>
                    <span>•</span>
                    <span className="text-amber-600 flex items-center gap-0.5 font-medium">
                      <Flame className="w-3 h-3 fill-current" />
                      {ride.caloriesKcal || Math.round(ride.distanceKm * 28)} kcal
                    </span>
                    {typeof ride.jumpCount === 'number' && ride.jumpCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#FC4C02] font-bold">
                          {ride.jumpCount} atlama
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      garminService.exportAsTcx(ride);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F0F7FB] text-xs font-bold text-[#007AC2] border border-[#E5E5EB] flex items-center gap-1 transition"
                    title="Garmin TCX İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>TCX</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportGpx(ride);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAFAFC] text-xs font-bold text-[#FC4C02] border border-[#E5E5EB] flex items-center gap-1 transition"
                    title="GPX İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>GPX</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ride Statistics Overlay Modal */}
      <RideStatsDetailModal
        ride={selectedRideForStats}
        onClose={() => setSelectedRideForStats(null)}
        onExportGpx={onExportGpx}
      />

      {/* Reel Preview Player Modal */}
      {previewReel && (
        <div
          onClick={() => setPreviewReel(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm aspect-[9/16] max-h-[88vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col justify-between animate-slideUp"
          >
            {/* Top Bar with Close & Mute */}
            <div className="relative z-30 p-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FC4C02] text-white">
                  KLİP ÖNİZLEME
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[150px]">
                  {previewReel.riderName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteReelId(previewReel.id)}
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition cursor-pointer"
                  title="Reel'i Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition cursor-pointer"
                  title={isPreviewMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                >
                  {isPreviewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FC4C02]" />}
                </button>
                <button
                  onClick={() => setPreviewReel(null)}
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {previewReel.mediaType === 'image' || (!previewReel.videoUrl && previewReel.photoUrl) ? (
                <img
                  src={previewReel.photoUrl || previewReel.posterUrl}
                  alt={previewReel.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={previewReel.videoUrl}
                  poster={previewReel.posterUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isPreviewMuted}
                  className="w-full h-full object-cover"
                />
              )}
              {previewReel.audioUrl && (
                <audio
                  src={previewReel.audioUrl}
                  autoPlay
                  loop
                  muted={isPreviewMuted}
                />
              )}
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="relative z-30 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-2">
              <p className="text-xs text-white leading-relaxed line-clamp-3 drop-shadow">
                {previewReel.caption}
              </p>

              {previewReel.location && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                  <Compass className="w-3 h-3 text-[#FC4C02]" />
                  <span>{previewReel.location}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-300 pt-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {previewReel.likesCount}
                  </span>
                  <span className="flex items-center gap-1 text-[#FC4C02] font-bold">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {previewReel.commentsCount}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {previewReel.date}
                </span>
              </div>

              {previewReel.songTitle && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#1DB954] truncate pt-0.5">
                  <Disc3 className="w-3.5 h-3.5 animate-spin" />
                  <span className="truncate">{previewReel.songTitle}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reel Delete Confirmation Modal */}
      {confirmDeleteReelId && (
        <div
          onClick={() => setConfirmDeleteReelId(null)}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-white border border-[#E2E4E9] rounded-xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#18181B]">Reel Silinsin mi?</h4>
                <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">
                  Bu Reels paylaşımı profilinizden ve akıştan kalıcı olarak silinecektir.
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
                onClick={() => {
                  reelsService.deleteReel(confirmDeleteReelId);
                  if (previewReel?.id === confirmDeleteReelId) {
                    setPreviewReel(null);
                  }
                  setConfirmDeleteReelId(null);
                }}
                className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
