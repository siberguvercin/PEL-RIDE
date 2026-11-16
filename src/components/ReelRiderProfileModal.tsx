import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  UserPlus,
  UserCheck,
  MessageSquare,
  Film,
  Camera,
  Heart,
  Eye,
  Disc3,
  Share2,
  Bike,
  Award,
  MapPin
} from 'lucide-react';
import { CyclingReel, RiderReelProfile } from '../types/reels';
import { reelsService } from '../services/reelsService';

interface ReelRiderProfileModalProps {
  rider: RiderReelProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectReel: (reel: CyclingReel) => void;
  onStartChat?: (riderName: string) => void;
}

export const ReelRiderProfileModal: React.FC<ReelRiderProfileModalProps> = ({
  rider,
  isOpen,
  onClose,
  onSelectReel,
  onStartChat
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    return rider ? reelsService.isFollowing(rider.handle) : false;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync isFollowing state when rider changes
  React.useEffect(() => {
    if (rider) {
      setIsFollowing(reelsService.isFollowing(rider.handle));
    }
  }, [rider]);

  if (!isOpen || !rider) return null;

  const riderReels = reelsService.getRiderReels(rider.handle);

  const handleToggleFollow = () => {
    const next = reelsService.toggleFollowRider(rider.handle);
    setIsFollowing(next);
    setToastMessage(next ? `${rider.name} takip edildi!` : `${rider.name} takipten çıkarıldı.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleMessageClick = () => {
    if (onStartChat) {
      onStartChat(rider.name);
      onClose();
    } else {
      setToastMessage(`${rider.name} ile sohbet başlatıldı.`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#rider=${encodeURIComponent(rider.handle)}`);
      setToastMessage('Profil bağlantısı kopyalandı! 📋');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121216] text-white rounded-t-2xl sm:rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slideUp relative"
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 inset-x-4 z-50 p-3 rounded-xl bg-[#FC4C02] text-white text-xs font-bold shadow-xl flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-[#FC4C02] uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>SPORCU REELS PROFİLİ</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Profili Paylaş"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Header Card: Avatar, Handles, Follow & Message CTA */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            {/* Avatar with Gradient Border */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FC4C02] via-amber-500 to-rose-500 shadow-lg">
                {rider.avatar ? (
                  <img
                    src={rider.avatar}
                    alt={rider.name}
                    className="w-full h-full rounded-full object-cover border-2 border-[#121216]"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#18181D] flex items-center justify-center font-black text-2xl text-white">
                    {rider.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {rider.isVerified && (
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#FC4C02] text-white flex items-center justify-center shadow-md border-2 border-[#121216]"
                  title="Doğrulanmış Sporcu"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            {/* Info and Buttons */}
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white truncate">
                    {rider.name}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FC4C02]/15 text-[#FC4C02] font-bold border border-[#FC4C02]/30">
                    Peloton Sporcusu
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {rider.handle}
                </p>
              </div>

              {/* Bio */}
              <p className="text-xs text-zinc-300 leading-relaxed">
                {rider.bio || 'Yol, gravel ve tırmanış tutkunu Peloton reels üreticisi.'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                    isFollowing
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                      : 'bg-[#FC4C02] hover:bg-[#E34402] text-white shadow-[#FC4C02]/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Takip Ediliyor</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Takip Et</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleMessageClick}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#FC4C02]" />
                  <span>Mesaj</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Klipler</span>
              <strong className="text-sm sm:text-base font-black text-white font-mono">
                {riderReels.length}
              </strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Takipçi</span>
              <strong className="text-sm sm:text-base font-black text-white font-mono">
                {rider.followersCount.toLocaleString('tr-TR')}
              </strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Takip</span>
              <strong className="text-sm sm:text-base font-black text-white font-mono">
                {rider.followingCount}
              </strong>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Mesafe</span>
              <strong className="text-sm sm:text-base font-black text-[#FC4C02] font-mono">
                {rider.totalDistanceKm || 1240} <small className="text-[9px]">km</small>
              </strong>
            </div>
          </div>

          {/* Reels Tab Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FC4C02]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Yayınlanan Reels Klipleri ({riderReels.length})
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400">
                Dokun & İzle
              </span>
            </div>

            {riderReels.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
                <Film className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">Henüz yayınlanmış klip yok</p>
                <p className="text-[11px] text-zinc-500">Bu sporcu henüz yeni bir video veya fotoğraf Reels'ı yüklemedi.</p>
              </div>
            ) : (
              /* 9:16 Aspect Ratio Reels Grid (Instagram Style) */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {riderReels.map((reel) => {
                  const isImage = reel.mediaType === 'image' || (!reel.videoUrl && !!reel.photoUrl);
                  const views = reel.viewsCount || (reel.likesCount * 6 + 120);

                  return (
                    <div
                      key={reel.id}
                      onClick={() => {
                        onSelectReel(reel);
                        onClose();
                      }}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-zinc-800/80 hover:border-[#FC4C02] transition cursor-pointer shadow-md hover:scale-[1.02] duration-200"
                    >
                      {/* Thumbnail Image */}
                      <img
                        src={reel.posterUrl || reel.photoUrl}
                        alt={reel.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Media Type Badge */}
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white">
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
                      </div>

                      {/* Gradient Shadow Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                      {/* Bottom Stats & Song Info */}
                      <div className="absolute bottom-2 inset-x-2 z-10 space-y-1">
                        <p className="text-[10px] text-white font-medium line-clamp-1 leading-tight drop-shadow">
                          {reel.caption}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono">
                          <span className="flex items-center gap-1 text-white font-bold">
                            <Eye className="w-3 h-3 text-zinc-400" />
                            {views > 1000 ? `${(views / 1000).toFixed(1)}K` : views}
                          </span>
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <Heart className="w-3 h-3 fill-current" />
                            {reel.likesCount}
                          </span>
                        </div>

                        {reel.songTitle && (
                          <div className="flex items-center gap-1 text-[9px] text-[#1DB954] truncate pt-0.5">
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
      </div>
    </div>
  );
};
