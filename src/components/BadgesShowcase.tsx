import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Compass,
  Flag,
  Flame,
  Gauge,
  Lock,
  Moon,
  Mountain,
  Sunrise,
  X,
  Zap,
} from 'lucide-react';
import { BadgeCategory, BadgeIconKey, EvaluatedBadge, PersistedUserBadge, SavedRide } from '../types';
import { evaluateUserBadges, getBadgeTierLabel } from '../utils/badges';

interface BadgesShowcaseProps {
  savedRides: SavedRide[];
  persistedBadges?: PersistedUserBadge[];
}

type FilterOption = 'all' | 'unlocked' | 'distance' | 'time' | 'performance';

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'unlocked', label: 'Kazanılanlar' },
  { id: 'distance', label: 'Mesafe' },
  { id: 'time', label: 'Zaman' },
  { id: 'performance', label: 'Tırmanış & Güç' },
];

function renderBadgeIcon(iconKey: BadgeIconKey, className: string) {
  switch (iconKey) {
    case 'sunrise':
      return <Sunrise className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'mountain':
      return <Mountain className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'gauge':
      return <Gauge className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'flag':
      return <Flag className={className} />;
    case 'award':
    default:
      return <Award className={className} />;
  }
}

function getTierIconSurface(tier: EvaluatedBadge['tier'], unlocked: boolean): string {
  if (!unlocked) {
    return 'bg-[#EAECEF] text-[#71717A] border border-[#E2E4E9]';
  }
  switch (tier) {
    case 'pro':
      return 'bg-[#18181B] text-[#FC4C02] border border-[#18181B]';
    case 'gold':
      return 'bg-[#FC4C02] text-white border border-[#FC4C02]';
    case 'silver':
      return 'bg-[#FFF4EE] text-[#FC4C02] border border-[#FCD5C3]';
    case 'bronze':
    default:
      return 'bg-[#F8F9FA] text-[#18181B] border border-[#D4D4D8]';
  }
}

function formatUnlockDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({
  savedRides,
  persistedBadges = [],
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  const evaluatedBadges = useMemo(
    () => evaluateUserBadges(savedRides, persistedBadges),
    [savedRides, persistedBadges]
  );

  const unlockedCount = useMemo(
    () => evaluatedBadges.filter((b) => b.unlocked).length,
    [evaluatedBadges]
  );

  const totalXp = useMemo(
    () => evaluatedBadges.reduce((acc, b) => (b.unlocked ? acc + b.xpReward : acc), 0),
    [evaluatedBadges]
  );

  const filteredBadges = useMemo(() => {
    const matches = evaluatedBadges.filter((b) => {
      if (filter === 'unlocked') return b.unlocked;
      if (filter === 'distance') return b.category === 'distance';
      if (filter === 'time') return b.category === 'time';
      if (filter === 'performance') {
        const perfCats: BadgeCategory[] = ['elevation', 'performance', 'consistency'];
        return perfCats.includes(b.category);
      }
      return true;
    });

    return [...matches].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return b.progressPct - a.progressPct;
    });
  }, [evaluatedBadges, filter]);

  return (
    <section className="bg-white border border-[#E2E4E9] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFF4EE] border border-[#FCD5C3] text-[#FC4C02] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
              Rozetler ve Başarımlar
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#71717A] mt-0.5 tabular-nums">
              <span className="font-semibold text-[#18181B]">
                {unlockedCount} / {evaluatedBadges.length} Kazanıldı
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-[#FC4C02]">
                {totalXp.toLocaleString('tr-TR')} XP
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg border border-[#E2E4E9] overflow-x-auto max-w-full">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                filter === opt.id
                  ? 'bg-white text-[#FC4C02]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State for "Kazanılanlar" filter when 0 unlocked */}
      {filteredBadges.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] space-y-1.5">
          <Award className="w-6 h-6 text-[#71717A] mx-auto" />
          <p className="text-xs font-bold text-[#18181B]">Bu kategoride henüz kazanılmış rozet yok</p>
          <p className="text-[11px] text-[#71717A]">
            Sürüş kaydettikçe kilometre, tırmanış ve zaman hedefleri otomatik olarak açılır.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredBadges.map((badge) => {
            const tierLabel = getBadgeTierLabel(badge.tier);
            const unlockDateStr = formatUnlockDate(badge.unlockedAt);

            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 cursor-pointer ${
                  badge.unlocked
                    ? 'bg-white border-[#FC4C02]/45 hover:border-[#FC4C02]'
                    : 'bg-[#F8F9FA] border-[#E2E4E9] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTierIconSurface(
                        badge.tier,
                        badge.unlocked
                      )}`}
                    >
                      {renderBadgeIcon(badge.iconKey, 'w-5 h-5')}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold truncate ${
                          badge.unlocked ? 'text-[#18181B]' : 'text-[#52525B]'
                        }`}
                      >
                        {badge.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-[#71717A] mt-0.5 tabular-nums">
                        <span>{tierLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className={badge.unlocked ? 'text-[#FC4C02] font-semibold' : ''}>
                          +{badge.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {badge.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#FC4C02] shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0 mt-0.5" />
                  )}
                </div>

                <p className="text-[11px] text-[#52525B] line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                {/* Progress or Unlock Footer */}
                <div className="pt-2 border-t border-[#ECEEF2] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                    {badge.unlocked ? (
                      <>
                        <span className="font-semibold text-[#18181B]">Tamamlandı</span>
                        <span className="text-[#71717A]">{unlockDateStr || '%100'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#52525B] font-semibold">
                          {badge.currentValue.toLocaleString('tr-TR')} /{' '}
                          {badge.targetValue.toLocaleString('tr-TR')} {badge.unit}
                        </span>
                        <span className="text-[#71717A] font-semibold">%{badge.progressPct}</span>
                      </>
                    )}
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#ECEEF2] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        badge.unlocked ? 'bg-[#FC4C02]' : 'bg-[#A1A1AA]'
                      }`}
                      style={{ width: `${badge.progressPct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-[#E2E4E9] rounded-xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Rozet Detayı
              </span>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] transition cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto ${getTierIconSurface(
                  selectedBadge.tier,
                  selectedBadge.unlocked
                )}`}
              >
                {renderBadgeIcon(selectedBadge.iconKey, 'w-7 h-7')}
              </div>
              <h4 className="text-base font-extrabold text-[#18181B]">{selectedBadge.title}</h4>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#71717A] tabular-nums">
                <span>{getBadgeTierLabel(selectedBadge.tier)} Seviye</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-bold text-[#FC4C02]">+{selectedBadge.xpReward} XP</span>
              </div>
            </div>

            <p className="text-xs text-[#52525B] text-center leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] space-y-2 text-xs">
              <div className="flex items-center justify-between tabular-nums">
                <span className="text-[#71717A] font-medium">Durum</span>
                <span
                  className={`font-bold ${
                    selectedBadge.unlocked ? 'text-emerald-600' : 'text-[#18181B]'
                  }`}
                >
                  {selectedBadge.unlocked ? 'Kazanıldı' : 'Devam Ediyor'}
                </span>
              </div>
              <div className="flex items-center justify-between tabular-nums">
                <span className="text-[#71717A] font-medium">İlerleme</span>
                <span className="font-mono font-bold text-[#18181B]">
                  {selectedBadge.currentValue.toLocaleString('tr-TR')} /{' '}
                  {selectedBadge.targetValue.toLocaleString('tr-TR')} {selectedBadge.unit} (%
                  {selectedBadge.progressPct})
                </span>
              </div>
              {selectedBadge.unlocked && selectedBadge.unlockedAt && (
                <div className="flex items-center justify-between tabular-nums">
                  <span className="text-[#71717A] font-medium">Kazanma Tarihi</span>
                  <span className="font-semibold text-[#18181B]">
                    {formatUnlockDate(selectedBadge.unlockedAt)}
                  </span>
                </div>
              )}
              {selectedBadge.unlocked && selectedBadge.triggerRideTitle && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#71717A] font-medium shrink-0">Sürüş</span>
                  <span className="font-semibold text-[#18181B] truncate">
                    {selectedBadge.triggerRideTitle}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
