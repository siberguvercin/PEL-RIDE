import React, { useState } from 'react';
import {
  X,
  User,
  Bike,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { LeaderboardRider } from '../types';

interface RiderProfileModalProps {
  rider: LeaderboardRider | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChatWithRider: (riderName: string) => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({
  rider,
  isOpen,
  onClose,
  onStartChatWithRider,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);

  if (!isOpen || !rider) return null;

  const recentActivities = [
    {
      title: 'Boğaz Sahil Tempolu Antrenman',
      date: '2 gün önce',
      distance: (rider.totalDistanceKm * 0.08).toFixed(1),
      climb: Math.round(rider.totalClimbM * 0.06),
      speed: (rider.ftpWatts > 300 ? 34.2 : 28.5).toFixed(1)
    },
    {
      title: 'Hafta Sonu Tırmanış Etabı',
      date: '5 gün önce',
      distance: (rider.totalDistanceKm * 0.12).toFixed(1),
      climb: Math.round(rider.totalClimbM * 0.15),
      speed: (rider.ftpWatts > 300 ? 31.8 : 26.2).toFixed(1)
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5EB]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#FC4C02]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#878792]">
              SPORCU PROFİLİ
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 bg-white">
          {/* Hero Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB]">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#FC4C02] text-white flex items-center justify-center text-xl font-black shadow-sm">
                {rider.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-lg text-[#242428] leading-tight">
                    {rider.name}
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-[#FC4C02]" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFF2ED] text-[#FC4C02] uppercase">
                    {rider.divisionName}
                  </span>
                  <span className="text-[10px] text-[#878792] font-mono font-bold">
                    #{rider.rank} KÜRESEL SIRA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                  isFollowing
                    ? 'bg-white text-[#242428] border border-[#E5E5EB]'
                    : 'bg-[#FC4C02] hover:bg-[#E34402] text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Takip Ediliyor</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Takip Et</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onStartChatWithRider(rider.name);
                  onClose();
                }}
                className="p-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] transition cursor-pointer shadow-sm"
                title="Sohbet Başlat"
              >
                <MessageSquare className="w-4 h-4 text-[#FC4C02]" />
              </button>
            </div>
          </div>

          {/* Key Cycling Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#F7F7FA] p-3 rounded-2xl border border-[#E5E5EB] text-center">
              <span className="text-[9px] uppercase font-bold text-[#878792] block">TOPLAM MESAFE</span>
              <strong className="text-lg font-black font-mono text-[#242428]">
                {rider.totalDistanceKm}
              </strong>
              <small className="text-[10px] text-[#878792] block">km</small>
            </div>

            <div className="bg-[#F7F7FA] p-3 rounded-2xl border border-[#E5E5EB] text-center">
              <span className="text-[9px] uppercase font-bold text-[#878792] block">TOPLAM İRTİFA</span>
              <strong className="text-lg font-black font-mono text-[#FC4C02]">
                {rider.totalClimbM}
              </strong>
              <small className="text-[10px] text-[#878792] block">metre</small>
            </div>

            <div className="bg-[#F7F7FA] p-3 rounded-2xl border border-[#E5E5EB] text-center">
              <span className="text-[9px] uppercase font-bold text-[#878792] block">FTP GÜCÜ</span>
              <strong className="text-lg font-black font-mono text-[#242428]">
                {rider.ftpWatts}
              </strong>
              <small className="text-[10px] text-[#878792] block">W ({rider.wattsPerKg} w/kg)</small>
            </div>

            <div className="bg-[#F7F7FA] p-3 rounded-2xl border border-[#E5E5EB] text-center">
              <span className="text-[9px] uppercase font-bold text-[#878792] block">LİG PUANI</span>
              <strong className="text-lg font-black font-mono text-[#FC4C02]">
                {rider.points.toLocaleString('tr-TR')}
              </strong>
              <small className="text-[10px] text-[#878792] block">RP</small>
            </div>
          </div>

          {/* Bike Garage */}
          <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2.5">
              <Bike className="w-4 h-4 text-[#FC4C02]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#878792]">
                Kayıtlı Bisikletler
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                <strong className="text-xs text-[#242428] block">S-Works Tarmac SL8</strong>
                <span className="text-[10px] text-[#878792]">Yol / Aero Karbon</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                <strong className="text-xs text-[#242428] block">Canyon Grizl CF</strong>
                <span className="text-[10px] text-[#878792]">Gravel / Macera</span>
              </div>
            </div>
          </div>

          {/* Recent Rides */}
          <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#878792] mb-2.5">
              Son Aktiviteler
            </h4>
            <div className="space-y-2">
              {recentActivities.map((act, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#242428]">{act.title}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-[#878792] font-mono mt-0.5">
                      <span>{act.date}</span>
                      <span>•</span>
                      <span>{act.distance} km</span>
                      <span>•</span>
                      <span className="text-[#FC4C02]">+{act.climb}m</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#242428]">
                    {act.speed} <small className="text-[9px] text-[#878792]">km/s</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
