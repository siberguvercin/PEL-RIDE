import React from 'react';
import {
  Trophy,
  ChevronRight,
  Crown,
  Shield,
  Globe
} from 'lucide-react';
import { calculateUserRank } from '../utils/rankings';

interface RankedProgressionCardProps {
  stats: {
    totalDistanceKm: number;
    totalClimbM: number;
    ftpWatts: number;
    ridesCount: number;
  };
  onOpenLeaderboard: () => void;
}

export const RankedProgressionCard: React.FC<RankedProgressionCardProps> = ({
  stats,
  onOpenLeaderboard,
}) => {
  const rank = calculateUserRank(stats);
  const div = rank.division;
  const isUnreal = div.tier === 'Unreal';

  return (
    <div className="rounded-xl p-5 sm:p-6 border border-[#E2E4E9] bg-white">
      <div className="flex flex-col space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#52525B]">
            <Trophy className="w-4 h-4 text-[#FC4C02]" />
            <span>Sporcu Seviyesi</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#18181B]">{div.name}</span>
          </div>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] text-xs font-semibold border border-[#E2E4E9] transition cursor-pointer group"
          >
            <Globe className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span>Liderlik Tablosu</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#52525B] group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Main Rank Summary */}
        <div className="flex items-center gap-4">
          <div
            className="relative w-16 h-16 rounded-xl flex items-center justify-center border shrink-0 bg-[#F8F9FA]"
            style={{ borderColor: div.borderColor }}
          >
            {isUnreal ? (
              <Crown className="w-8 h-8 text-[#FC4C02]" />
            ) : (
              <span className="text-2xl select-none">{div.icon}</span>
            )}
            {(div.division || isUnreal) && (
              <span className="absolute -bottom-2 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white bg-[#18181B]">
                {isUnreal ? 'TOP 1%' : `DIV ${div.division}`}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#18181B] truncate">
              {div.name}
            </h2>
            <p className="text-xs font-medium text-[#52525B] mt-0.5">{div.rankTitle}</p>

            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-extrabold font-mono text-[#18181B]">
                {rank.points.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-bold text-[#FC4C02]">RP</span>
              {rank.nextDivision && (
                <span className="text-xs text-[#71717A]">
                  · Sonraki kademeye {rank.pointsToNext} RP ({rank.nextDivision.name})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progression Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#52525B]">
              {isUnreal ? 'Maksimum Kademe' : `${div.name} İlerlemesi`}
            </span>
            <span className="font-mono font-bold text-[#FC4C02]">
              {isUnreal ? '100%' : `%${rank.progressPct}`}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#EAECEF] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-[#FC4C02]"
              style={{
                width: isUnreal ? '100%' : `${rank.progressPct}%`,
              }}
            />
          </div>
        </div>

        {/* Hairline-Divided Breakdown Strip (No nested cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] border-t border-[#ECEEF2] pt-4 text-center">
          <div className="py-1.5 sm:py-0 px-2">
            <span className="text-[11px] font-medium text-[#71717A] block">
              Mesafe ({stats.totalDistanceKm.toFixed(0)} km)
            </span>
            <span className="text-sm font-bold font-mono text-[#18181B]">
              +{rank.breakdown.distance} RP
            </span>
          </div>

          <div className="py-1.5 sm:py-0 px-2">
            <span className="text-[11px] font-medium text-[#71717A] block">
              İrtifa ({stats.totalClimbM} m)
            </span>
            <span className="text-sm font-bold font-mono text-[#18181B]">
              +{rank.breakdown.climb} RP
            </span>
          </div>

          <div className="py-1.5 sm:py-0 px-2">
            <span className="text-[11px] font-medium text-[#71717A] block">
              FTP Güç ({stats.ftpWatts} W)
            </span>
            <span className="text-sm font-bold font-mono text-[#FC4C02]">
              +{rank.breakdown.power} RP
            </span>
          </div>

          <div className="py-1.5 sm:py-0 px-2">
            <span className="text-[11px] font-medium text-[#71717A] block">
              Aktivite ({stats.ridesCount})
            </span>
            <span className="text-sm font-bold font-mono text-[#18181B]">
              +{rank.breakdown.rides} RP
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-xs text-[#71717A] pt-2 border-t border-[#ECEEF2]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span>Kademe koruması aktif</span>
          </div>
          <span className="font-mono font-semibold text-[#52525B]">Sezon: 42 gün</span>
        </div>
      </div>
    </div>
  );
};
