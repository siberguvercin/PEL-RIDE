import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Crown,
  Search
} from 'lucide-react';
import { LeaderboardRider } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRider?: (rider: LeaderboardRider) => void;
  leaderboard?: LeaderboardRider[];
  currentUserId?: string;
  userStats: {
    name: string;
    points: number;
    totalDistanceKm: number;
    totalClimbM: number;
    ftpWatts: number;
    ridesCount?: number;
  };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  onSelectRider,
  leaderboard: externalLeaderboard = [],
  currentUserId,
  userStats,
}) => {
  const [filter, setFilter] = useState<'all' | 'month' | 'week' | 'power'>('all');
  const [apiRiders, setApiRiders] = useState<LeaderboardRider[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApiRiders(data);
      })
      .catch((err) => console.warn('Leaderboard fetch error:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const myEffectiveId = currentUserId || 'current-user';
  const byId = new Map<string, LeaderboardRider>();
  [...apiRiders, ...externalLeaderboard].forEach((r) => {
    if (r.id === myEffectiveId || r.id === 'current-user') return;
    byId.set(r.id, r);
  });

  const fullList: LeaderboardRider[] = Array.from(byId.values());
  const userEntry: LeaderboardRider = {
    rank: 0,
    id: myEffectiveId,
    name: `${userStats.name} (Sen)`,
    tier: userStats.points >= 15000 ? 'Unreal' : userStats.points >= 10000 ? 'Champion' : 'Diamond',
    divisionName: userStats.points >= 15000 ? 'PRO ELİT' : 'ELİT II',
    points: userStats.points,
    totalDistanceKm: Number(userStats.totalDistanceKm.toFixed(1)),
    totalClimbM: Math.round(userStats.totalClimbM),
    ftpWatts: userStats.ftpWatts,
    wattsPerKg: parseFloat((userStats.ftpWatts / 72).toFixed(2)),
    ridesCount: userStats.ridesCount ?? 0,
    isOnline: true,
    isLive: false,
  };

  const sorted = [...fullList, userEntry].sort((a, b) => {
    if (filter === 'power') return b.ftpWatts - a.ftpWatts;
    if (filter === 'month') return (b.points * 0.7) - (a.points * 0.7);
    if (filter === 'week') return (b.points * 0.3) - (a.points * 0.3);
    return b.points - a.points;
  });

  const rankedList = sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
  const myRank = rankedList.find((r) => r.id === myEffectiveId);

  const filteredList = rankedList.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF2ED] text-[#FC4C02]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#242428] flex items-center gap-2">
                Küresel Liderlik Tablosu
                <span className="text-[10px] bg-[#FC4C02] text-white px-2 py-0.5 rounded font-black uppercase">
                  CANLI RP
                </span>
              </h2>
              <p className="text-xs text-[#878792]">
                Sıralamalar tamamlanan sürüşler, tırmanışlar ve segment performanslarına göredir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3 bg-[#F7F7FA] border-b border-[#E5E5EB] flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E5EB] w-full sm:w-auto shadow-sm">
            {[
              { id: 'all', label: 'Tüm Zamanlar' },
              { id: 'month', label: 'Bu Ay' },
              { id: 'week', label: 'Bu Hafta' },
              { id: 'power', label: '⚡ FTP Gücü' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filter === t.id
                    ? 'bg-[#FC4C02] text-white shadow-sm'
                    : 'text-[#878792] hover:text-[#242428]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#878792]" />
            <input
              type="text"
              placeholder="Bisikletçi ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-xs text-[#242428] pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E5EB] focus:border-[#FC4C02] outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Podium Top 3 Cards */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-white border-b border-[#E5E5EB]">
          {/* #2 Silver */}
          {rankedList[1] && (
            <div className="bg-[#F7F7FA] border border-[#E5E5EB] rounded-2xl p-2.5 sm:p-3 text-center relative flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl select-none">🥈</span>
              <span className="font-bold text-xs sm:text-sm text-[#242428] truncate max-w-[120px] mt-1">
                {rankedList[1].name}
              </span>
              <span className="text-[10px] font-bold text-[#878792] uppercase">
                {rankedList[1].divisionName}
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-[#242428] mt-1">
                {rankedList[1].points.toLocaleString('tr-TR')} RP
              </span>
            </div>
          )}

          {/* #1 Gold */}
          {rankedList[0] && (
            <div className="bg-[#FFF8F5] border-2 border-[#FC4C02] rounded-2xl p-3 sm:p-4 text-center relative flex flex-col items-center justify-center shadow-md shadow-[#FC4C02]/15 -translate-y-1">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-[#FC4C02]" />
              <span className="font-black text-xs sm:text-base text-[#242428] truncate max-w-[140px] mt-1">
                {rankedList[0].name}
              </span>
              <span className="text-[10px] font-black text-[#FC4C02] uppercase bg-[#FFF2ED] px-2 py-0.5 rounded-full mt-0.5">
                {rankedList[0].divisionName}
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-[#FC4C02] mt-1">
                {rankedList[0].points.toLocaleString('tr-TR')} RP
              </span>
            </div>
          )}

          {/* #3 Bronze */}
          {rankedList[2] && (
            <div className="bg-[#F7F7FA] border border-[#E5E5EB] rounded-2xl p-2.5 sm:p-3 text-center relative flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl select-none">🥉</span>
              <span className="font-bold text-xs sm:text-sm text-[#242428] truncate max-w-[120px] mt-1">
                {rankedList[2].name}
              </span>
              <span className="text-[10px] font-bold text-[#878792] uppercase">
                {rankedList[2].divisionName}
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-[#242428] mt-1">
                {rankedList[2].points.toLocaleString('tr-TR')} RP
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Riders List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-[#F7F7FA]">
          {filteredList.map((rider) => {
            const isMe = rider.id === 'current-user';

            return (
              <div
                key={rider.id}
                onClick={() => onSelectRider && onSelectRider(rider)}
                className={`p-3 rounded-2xl transition flex items-center justify-between cursor-pointer group shadow-sm ${
                  isMe
                    ? 'bg-[#FFF8F5] border-2 border-[#FC4C02]'
                    : 'bg-white hover:bg-[#F4F4F6] border border-[#E5E5EB]'
                }`}
              >
                {/* Rank & Rider info */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span
                    className={`w-7 text-center font-mono font-black text-sm ${
                      rider.rank === 1
                        ? 'text-[#FC4C02]'
                        : rider.rank === 2
                        ? 'text-zinc-600'
                        : rider.rank === 3
                        ? 'text-amber-600'
                        : 'text-[#878792]'
                    }`}
                  >
                    #{rider.rank}
                  </span>

                  <div className="w-9 h-9 rounded-xl bg-[#242428] text-white flex items-center justify-center font-bold text-xs">
                    {rider.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[#242428] truncate">
                        {rider.name}
                      </h4>
                      {isMe && (
                        <span className="text-[9px] bg-[#FC4C02] text-white font-black px-1.5 py-0.2 rounded">
                          BEN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#878792] font-mono mt-0.5">
                      <span className="font-bold text-[#242428]">{rider.divisionName}</span>
                      <span>•</span>
                      <span>{rider.totalDistanceKm} km</span>
                      <span>•</span>
                      <span className="text-[#FC4C02]">{rider.ftpWatts}W ({rider.wattsPerKg} w/kg)</span>
                    </div>
                  </div>
                </div>

                {/* RP Points */}
                <div className="text-right flex-shrink-0 font-mono">
                  <span className="text-sm sm:text-base font-black text-[#242428] block">
                    {rider.points.toLocaleString('tr-TR')}
                  </span>
                  <small className="text-[10px] text-[#FC4C02] font-bold">RP PUANI</small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current User Standing Sticky Bar */}
        {myRank && (
          <div className="p-3 bg-white border-t border-[#E5E5EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-black text-sm text-[#FC4C02]">
                Sıranız: #{myRank.rank}
              </span>
              <span className="text-xs text-[#494950]">
                {myRank.divisionName} · <strong className="text-[#242428]">{myRank.points.toLocaleString('tr-TR')} RP</strong>
              </span>
            </div>
            <div className="text-xs font-mono text-[#878792]">
              Hedef: +{Math.max(120, 500 - (myRank.points % 500))} RP ile sonraki sıra
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
