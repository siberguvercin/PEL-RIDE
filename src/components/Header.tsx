import React from 'react';
import {
  Radio,
  MessageSquare,
  Trophy,
  CircleDot,
  Gauge
} from 'lucide-react';
import { StreamSession, GoogleUserProfile } from '../types';
import { calculateUserRank } from '../utils/rankings';

interface HeaderProps {
  activeStreams: StreamSession[];
  googleUser: GoogleUserProfile | null;
  rank?: ReturnType<typeof calculateUserRank>;
  onOpenLiveBroadcaster: () => void;
  onStartDirectNormalRide?: () => void;
  onWatchStream: (stream: StreamSession) => void;
  onGoToChat: () => void;
  onOpenLeaderboard: () => void;
  onOpenGoogleAuth: () => void;
  onOpenApiManagement?: () => void;
  onOpenAiCoach?: () => void;
  isConnected: boolean;
  unreadChatCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeStreams,
  googleUser,
  rank,
  onOpenLiveBroadcaster,
  onStartDirectNormalRide,
  onWatchStream,
  onGoToChat,
  onOpenLeaderboard,
  onOpenGoogleAuth,
  onOpenAiCoach,
  unreadChatCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-[#E2E4E9] sticky top-0 z-40 w-full max-w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#FC4C02] flex items-center justify-center font-extrabold text-white text-sm tracking-tight shrink-0">
          P
        </div>
        <span className="font-extrabold text-base tracking-tight text-[#18181B] whitespace-nowrap">
          PEL
        </span>
      </div>

      {/* Active Live Streams Trigger (Desktop) */}
      {activeStreams.length > 0 && (
        <button
          type="button"
          onClick={() => onWatchStream(activeStreams[0])}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFF4EE] border border-[#FCD5C3] text-[#18181B] text-xs font-semibold hover:bg-[#FFEBE1] transition cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] animate-pulse shrink-0" />
          <span className="font-bold text-[#FC4C02]">Canlı Yayın ({activeStreams.length})</span>
          <span className="text-[#52525B] truncate max-w-[140px]">
            · {activeStreams[0].streamerName}
          </span>
        </button>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onStartDirectNormalRide && (
          <button
            type="button"
            onClick={onStartDirectNormalRide}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
            title="Kamerasız GPS sürüş kaydını aç"
          >
            <CircleDot className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sürüş Kaydet</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] border border-[#E2E4E9] transition cursor-pointer whitespace-nowrap shrink-0"
          title="Liderlik Tablosu & Sporcu Derecesi"
        >
          {rank ? (
            <>
              <Trophy className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span className="text-xs font-bold hidden md:inline">{rank.division.name}</span>
              <span className="text-xs font-mono font-bold text-[#52525B]">
                {rank.points.toLocaleString('tr-TR')} RP
              </span>
            </>
          ) : (
            <Trophy className="w-4 h-4 text-[#FC4C02]" />
          )}
        </button>

        {onOpenAiCoach && (
          <button
            type="button"
            onClick={onOpenAiCoach}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
            title="Performans Koçu & Lastik PSI"
          >
            <Gauge className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span className="hidden sm:inline">Sürüş Koçu</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenLiveBroadcaster}
          className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] font-semibold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
          title="Canlı Yayın Başlat"
        >
          <Radio className="w-3.5 h-3.5 text-[#FC4C02]" />
          <span>Canlı Yayın</span>
        </button>

        <button
          type="button"
          onClick={onGoToChat}
          className="w-9 h-9 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] transition relative cursor-pointer flex items-center justify-center shrink-0"
          title="Peloton Sohbeti & Özel Mesajlar"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FC4C02] text-white text-[9px] font-bold flex items-center justify-center">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenGoogleAuth}
          className="flex items-center gap-2 px-2 h-9 rounded-lg bg-white hover:bg-[#F4F5F7] text-[#18181B] border border-[#E2E4E9] transition cursor-pointer shrink-0"
          title={googleUser ? `Giriş yapıldı: ${googleUser.email}` : 'Oturum Aç'}
        >
          {googleUser ? (
            <>
              {googleUser.photoUrl ? (
                <img
                  src={googleUser.photoUrl}
                  alt={googleUser.name}
                  className="w-6 h-6 rounded-md object-cover border border-[#E2E4E9] shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-[#FC4C02] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold hidden md:inline truncate max-w-[90px] text-[#18181B]">
                {googleUser.name.split(' ')[0]}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold text-[#18181B] px-1">Giriş</span>
          )}
        </button>
      </div>
    </header>
  );
};
