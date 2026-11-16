import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Mountain,
  Compass,
  CheckCircle2,
  ChevronRight,
  Flame,
  Calendar,
  Zap,
  Target,
  ArrowUpRight
} from 'lucide-react';
import { SavedRide } from '../types';

export interface Challenge {
  id: string;
  title: string;
  subtitle: string;
  category: 'distance' | 'climb' | 'single_ride' | 'frequency';
  targetValue: number;
  unit: string;
  rewardPoints: number;
  badgeName: string;
  badgeIcon: 'distance' | 'everest' | 'granfondo' | 'streak';
  description: string;
  isJoined: boolean;
  claimed: boolean;
}

interface MonthlyChallengesProps {
  savedRides: SavedRide[];
  onStartRide?: () => void;
  onOpenLeaderboard?: () => void;
}

export const MonthlyChallenges: React.FC<MonthlyChallengesProps> = ({
  savedRides,
  onStartRide,
  onOpenLeaderboard
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Calculate current month's stats from rides
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyRides = savedRides.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate progress metrics
  const monthlyDistanceKm = monthlyRides.length > 0
    ? monthlyRides.reduce((acc, r) => acc + r.distanceKm, 0)
    : savedRides.reduce((acc, r) => acc + r.distanceKm, 0); // fallback to all rides if mock dates

  const monthlyClimbM = monthlyRides.length > 0
    ? monthlyRides.reduce((acc, r) => acc + r.climbM, 0)
    : savedRides.reduce((acc, r) => acc + r.climbM, 0);

  const longestSingleRideKm = savedRides.reduce((max, r) => Math.max(max, r.distanceKm), 0);
  const totalRidesCount = savedRides.length;

  // Challenge definitions with persistence
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem('pel_monthly_challenges');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: 'chal-100km',
        title: 'Kasım 100km Gran Mesafe',
        subtitle: 'Bu ay toplamda en az 100 kilometre sürüş kaydet.',
        category: 'distance',
        targetValue: 100,
        unit: 'km',
        rewardPoints: 350,
        badgeName: '100K Century Kulübü',
        badgeIcon: 'distance',
        description: 'Tüm açık hava antrenmanlarınızı ve grup turlarınızı kapsar. Ay sonuna kadar tamamlayarak altın rozet ve 350 RP puanı kazanın.',
        isJoined: true,
        claimed: false
      },
      {
        id: 'chal-everest',
        title: 'Everest Tırmanışı (8,848m)',
        subtitle: 'Yeryüzünün en yüksek zirvesi kadar irtifa kazan.',
        category: 'climb',
        targetValue: 8848,
        unit: 'm',
        rewardPoints: 1200,
        badgeName: 'Everesting Zirve Rozeti',
        badgeIcon: 'everest',
        description: 'Bisikletçilerin en prestijli tırmanış meydan okuması. Everest Dağı yüksekliğindeki 8.848 metrelik kümülatif tırmanışa ulaşarak efsanevi Everesting rozetinin sahibi olun.',
        isJoined: true,
        claimed: false
      },
      {
        id: 'chal-granfondo',
        title: '75km Tek Seferde Gran Fondo',
        subtitle: 'Tek bir sürüşte kesintisiz 75km mesafeyi aş.',
        category: 'single_ride',
        targetValue: 75,
        unit: 'km',
        rewardPoints: 400,
        badgeName: 'Dayanıklılık Ustası',
        badgeIcon: 'granfondo',
        description: 'Uzun mesafe kondisyon testi. Tek bir aktivitede durmaksızın veya kısa molalarla 75 km barajını geçin.',
        isJoined: true,
        claimed: false
      },
      {
        id: 'chal-frequency',
        title: 'Haftalık Düzen: 12 Sürüş',
        subtitle: 'Bu ay en az 12 farklı sürüş seansı tamamla.',
        category: 'frequency',
        targetValue: 12,
        unit: 'sürüş',
        rewardPoints: 300,
        badgeName: 'Peloton Sadakat Rozeti',
        badgeIcon: 'streak',
        description: 'Devamlılık formun anahtarıdır. Haftada en az 3 sürüş yaparak ay sonunda 12 seansa ulaşın.',
        isJoined: true,
        claimed: false
      }
    ];
  });

  const saveChallenges = (updated: Challenge[]) => {
    setChallenges(updated);
    localStorage.setItem('pel_monthly_challenges', JSON.stringify(updated));
  };

  const getCurrentValue = (challenge: Challenge): number => {
    switch (challenge.category) {
      case 'distance':
        return Math.round(monthlyDistanceKm * 10) / 10;
      case 'climb':
        return Math.round(monthlyClimbM);
      case 'single_ride':
        return Math.round(longestSingleRideKm * 10) / 10;
      case 'frequency':
        return totalRidesCount;
      default:
        return 0;
    }
  };

  const [rewardBanner, setRewardBanner] = useState<string | null>(null);

  const handleClaimReward = (challengeId: string) => {
    const target = challenges.find((c) => c.id === challengeId);
    if (!target) return;

    const updated = challenges.map((c) =>
      c.id === challengeId ? { ...c, claimed: true } : c
    );
    saveChallenges(updated);

    setRewardBanner(`TEBRİKLER! "${target.badgeName}" rozetini kazandınız (+${target.rewardPoints} RP eklendi).`);
    setTimeout(() => setRewardBanner(null), 5000);
  };

  const handleToggleJoin = (challengeId: string) => {
    const updated = challenges.map((c) =>
      c.id === challengeId ? { ...c, isJoined: !c.isJoined } : c
    );
    saveChallenges(updated);
  };

  // Month days remaining
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - now.getDate());
  const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    const cur = getCurrentValue(c);
    const isCompleted = cur >= c.targetValue;
    if (filter === 'active') return !isCompleted;
    if (filter === 'completed') return isCompleted;
    return true;
  });

  const completedCount = challenges.filter((c) => getCurrentValue(c) >= c.targetValue).length;

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-xl p-5 sm:p-6 space-y-5">
      {rewardBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {rewardBanner}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF2] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#FC4C02]/10 text-[#FC4C02] flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#18181B]">
                Aylık Meydan Okumalar
              </h2>
              <span className="text-[11px] font-semibold text-[#FC4C02] uppercase">
                · {monthName}
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Ay sonuna <strong className="text-[#18181B]">{daysRemaining} gün kaldı</strong></span>
              <span>·</span>
              <span className="font-semibold text-[#18181B]">{completedCount}/{challenges.length} Tamamlandı</span>
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F4F5F7] p-1 rounded-lg border border-[#E2E4E9] self-start sm:self-auto">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'active', label: 'Devam Eden' },
            { id: 'completed', label: `Tamamlanan (${completedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                filter === f.id
                  ? 'bg-white text-[#FC4C02]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredChallenges.map((challenge) => {
          const currentVal = getCurrentValue(challenge);
          const pct = Math.min(100, Math.round((currentVal / challenge.targetValue) * 100));
          const isFinished = currentVal >= challenge.targetValue;

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                isFinished
                  ? 'bg-white border-[#FC4C02]/50'
                  : 'bg-[#F8F9FA] hover:bg-white border-[#E2E4E9] hover:border-[#FC4C02]/40'
              }`}
            >
              {/* Top Row: Icon, Title, Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isFinished
                          ? 'bg-[#FC4C02] text-white'
                          : 'bg-white border border-[#E5E5EB] text-[#242428]'
                      }`}
                    >
                      {challenge.badgeIcon === 'everest' ? (
                        <Mountain className="w-5 h-5" />
                      ) : challenge.badgeIcon === 'distance' ? (
                        <Compass className="w-5 h-5" />
                      ) : challenge.badgeIcon === 'granfondo' ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <Target className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#242428] leading-tight">
                        {challenge.title}
                      </h3>
                      <span className="text-[11px] text-[#878792] block mt-0.5">
                        {challenge.badgeName}
                      </span>
                    </div>
                  </div>

                  {/* Completion badge / RP reward */}
                  <div className="text-right shrink-0">
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF2ED] border border-[#FC4C02]/30 text-[#FC4C02] text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        KAZANILDI
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-black font-mono text-[#FC4C02] bg-[#FFF2ED] px-2 py-0.5 rounded-md">
                        +{challenge.rewardPoints} RP
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#494950] line-clamp-2 mt-1 leading-relaxed">
                  {challenge.subtitle}
                </p>
              </div>

              {/* Middle: Progress Bar & Current Metric */}
              <div className="my-3 space-y-1.5 pt-2 border-t border-[#F0F0F4]">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-[#242428]">
                    {currentVal.toLocaleString('tr-TR')} / {challenge.targetValue.toLocaleString('tr-TR')} {challenge.unit}
                  </span>
                  <span className={isFinished ? 'text-[#FC4C02] font-black' : 'text-[#878792]'}>
                    %{pct}
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2.5 rounded-full bg-[#EBEBEF] overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFinished
                        ? 'bg-[#FC4C02] shadow-xs'
                        : 'bg-[#FC4C02]/85'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setSelectedChallenge(challenge)}
                  className="text-[11px] font-bold text-[#878792] hover:text-[#FC4C02] flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Detayları İncele</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  {isFinished && !challenge.claimed ? (
                    <button
                      onClick={() => handleClaimReward(challenge.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Rozeti Al</span>
                    </button>
                  ) : isFinished && challenge.claimed ? (
                    <span className="text-[11px] font-bold text-[#878792] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FC4C02]" />
                      Rozet Profilde
                    </span>
                  ) : onStartRide ? (
                    <button
                      onClick={onStartRide}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Sürüş Kaydet</span>
                      <ArrowUpRight className="w-3 h-3 text-[#FC4C02]" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E4E9] rounded-xl max-w-md w-full p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FC4C02]" />
                <h3 className="font-bold text-sm text-[#18181B]">Meydan Okuma Detayı</h3>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="text-[#71717A] hover:text-[#18181B] p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E4E9] space-y-2">
              <div className="w-14 h-14 rounded-xl bg-[#FC4C02]/10 text-[#FC4C02] flex items-center justify-center mx-auto">
                {selectedChallenge.badgeIcon === 'everest' ? (
                  <Mountain className="w-7 h-7" />
                ) : (
                  <Award className="w-7 h-7" />
                )}
              </div>
              <h4 className="font-bold text-base text-[#18181B]">
                {selectedChallenge.title}
              </h4>
              <span className="inline-block text-xs font-semibold text-[#FC4C02]">
                Ödül: {selectedChallenge.badgeName} · +{selectedChallenge.rewardPoints} RP
              </span>
            </div>

            <p className="text-xs text-[#494950] leading-relaxed">
              {selectedChallenge.description}
            </p>

            {/* Current progress in modal */}
            <div className="p-3 bg-white rounded-xl border border-[#E5E5EB] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#878792]">Mevcut Durum</span>
                <span className="text-[#242428] font-mono">
                  {getCurrentValue(selectedChallenge)} / {selectedChallenge.targetValue} {selectedChallenge.unit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EBEBEF] overflow-hidden">
                <div
                  className="h-full bg-[#FC4C02] rounded-full"
                  style={{
                    width: `${Math.min(100, (getCurrentValue(selectedChallenge) / selectedChallenge.targetValue) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Kapat
              </button>

              {onStartRide && (
                <button
                  onClick={() => {
                    setSelectedChallenge(null);
                    onStartRide();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Sürüşü Başlat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
