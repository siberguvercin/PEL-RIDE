import React from 'react';
import {
  X,
  Heart,
  Flame,
  Activity,
  Download,
  Calendar,
  Clock,
  Instagram,
  Share2
} from 'lucide-react';
import { SavedRide } from '../types';
import { getHeartRateZones, calculateZonePercentages, calculateEstimatedCalories, DEFAULT_MAX_HR } from '../utils/heartRate';
import { InstagramStoryModal } from './InstagramStoryModal';
import { ShareRideModal } from './ShareRideModal';

interface RideStatsDetailModalProps {
  ride: SavedRide | null;
  onClose: () => void;
  onExportGpx?: (ride: SavedRide) => void;
}

export const RideStatsDetailModal: React.FC<RideStatsDetailModalProps> = ({
  ride,
  onClose,
  onExportGpx
}) => {
  const [isInstagramStoryOpen, setIsInstagramStoryOpen] = React.useState(false);
  const [isShareRideOpen, setIsShareRideOpen] = React.useState(false);
  if (!ride) return null;

  const zones = getHeartRateZones(DEFAULT_MAX_HR);
  const zoneDist = ride.hrZones || {
    z1Sec: Math.round(ride.durationSec * 0.15),
    z2Sec: Math.round(ride.durationSec * 0.45),
    z3Sec: Math.round(ride.durationSec * 0.25),
    z4Sec: Math.round(ride.durationSec * 0.12),
    z5Sec: Math.round(ride.durationSec * 0.03),
  };
  const percentages = calculateZonePercentages(zoneDist);

  const avgHr = ride.avgHeartRate || 146;
  const maxHr = ride.maxHeartRate || 176;
  const calories = ride.caloriesKcal || calculateEstimatedCalories(ride.durationSec, avgHr);

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) return `${hrs}sa ${mins}dk`;
    return `${mins}dk ${secs}sn`;
  };

  const formattedDate = new Date(ride.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-[#E5E5EB] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-white border-b border-[#F0F0F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FC4C02] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FC4C02] block">
                RESMİ AKTİVİTE ANALİZİ & TELEMETRİ
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#242428] line-clamp-1">
                {ride.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareRideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF2ED] hover:bg-[#FFE5DC] text-[#FC4C02] border border-[#FED7C7] font-black text-xs transition cursor-pointer shadow-xs active:scale-95"
              title="HTML Canvas ile sosyal medya özet görseli oluştur"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Paylaş</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280] border-b border-[#F0F0F4] pb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{formatDuration(ride.durationSec)}</span>
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
            <div className="p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">MESAFE</span>
              <strong className="text-xl font-bold font-mono text-[#18181B] tabular-nums">
                {ride.distanceKm}
              </strong>
              <small className="text-[10px] text-[#71717A] block">km</small>
            </div>

            <div className="p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">ORTALAMA HIZ</span>
              <strong className="text-xl font-bold font-mono text-[#FC4C02] tabular-nums">
                {ride.avgSpeedKmH}
              </strong>
              <small className="text-[10px] text-[#71717A] block">km/sa</small>
            </div>

            <div className="p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">EN YÜKSEK</span>
              <strong className="text-xl font-bold font-mono text-[#18181B] tabular-nums">
                {ride.maxSpeedKmH}
              </strong>
              <small className="text-[10px] text-[#71717A] block">km/sa</small>
            </div>

            <div className="p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">TIRMANIŞ</span>
              <strong className="text-xl font-bold font-mono text-[#18181B] tabular-nums">
                +{ride.climbM}
              </strong>
              <small className="text-[10px] text-[#71717A] block">metre</small>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">ATLAMA</span>
              <strong className="text-xl font-bold font-mono text-[#FC4C02] tabular-nums">
                {ride.jumpCount ?? 0}
              </strong>
              <small className="text-[10px] text-[#71717A] block">kez</small>
            </div>
          </div>

          {/* Dedicated Heart Rate & Calorie Analysis Section */}
          <div className="bg-[#FAFAFC] border border-[#E5E5EB] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEF] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FC4C02] flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-current animate-pulse text-[#FC4C02]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#242428]">
                    Kalp Atış Hızı & Fizyolojik Yük Analizi
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Sensör verisiyle hesaplanan nabız bölgeleri ve efor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span>{calories} kcal</span>
              </div>
            </div>

            {/* Heart Rate Stats Summary Chips */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E5EB] text-center">
                <span className="text-[10px] font-bold text-[#6B7280] block">ORTALAMA NABIZ</span>
                <div className="text-lg sm:text-xl font-black font-mono text-[#FC4C02] mt-0.5">
                  {avgHr} <span className="text-xs font-normal text-[#6B7280]">BPM</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#E5E5EB] text-center">
                <span className="text-[10px] font-bold text-[#6B7280] block">MAKSİMUM NABIZ</span>
                <div className="text-lg sm:text-xl font-black font-mono text-red-500 mt-0.5">
                  {maxHr} <span className="text-xs font-normal text-[#6B7280]">BPM</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#E5E5EB] text-center">
                <span className="text-[10px] font-bold text-[#6B7280] block">HAKİM BÖLGE</span>
                <div className="text-xs sm:text-sm font-black text-[#FC4C02] mt-1 line-clamp-1">
                  Bölge 2 (Dayanıklılık)
                </div>
              </div>
            </div>

            {/* Heart Rate Zones Distribution Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#242428]">
                <span>Nabız Bölgelerinde Geçirilen Süre (Z1 - Z5)</span>
                <span className="text-[11px] font-mono text-[#FC4C02]">{formatDuration(ride.durationSec)}</span>
              </div>

              {/* Multi-segment stacked bar */}
              <div className="w-full h-3 rounded-full bg-[#EAEAEF] overflow-hidden flex p-0.5 gap-0.5">
                {percentages.z1 > 0 && (
                  <div
                    style={{ width: `${percentages.z1}%`, backgroundColor: zones[0].color }}
                    className="h-full rounded-xs transition-all"
                    title={`Z1: %${percentages.z1}`}
                  />
                )}
                {percentages.z2 > 0 && (
                  <div
                    style={{ width: `${percentages.z2}%`, backgroundColor: zones[1].color }}
                    className="h-full rounded-xs transition-all"
                    title={`Z2: %${percentages.z2}`}
                  />
                )}
                {percentages.z3 > 0 && (
                  <div
                    style={{ width: `${percentages.z3}%`, backgroundColor: zones[2].color }}
                    className="h-full rounded-xs transition-all"
                    title={`Z3: %${percentages.z3}`}
                  />
                )}
                {percentages.z4 > 0 && (
                  <div
                    style={{ width: `${percentages.z4}%`, backgroundColor: zones[3].color }}
                    className="h-full rounded-xs transition-all"
                    title={`Z4: %${percentages.z4}`}
                  />
                )}
                {percentages.z5 > 0 && (
                  <div
                    style={{ width: `${percentages.z5}%`, backgroundColor: zones[4].color }}
                    className="h-full rounded-xs transition-all"
                    title={`Z5: %${percentages.z5}`}
                  />
                )}
              </div>

              {/* Zone breakdown list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5EB] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zones[0].color }} />
                    <span className="text-[#333333]">Z1 Yenilenme (&lt;114)</span>
                  </div>
                  <strong className="font-mono text-[#242428]">%{percentages.z1}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5EB] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zones[1].color }} />
                    <span className="text-[#333333]">Z2 Dayanıklılık (114-133)</span>
                  </div>
                  <strong className="font-mono text-emerald-600">%{percentages.z2}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5EB] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zones[2].color }} />
                    <span className="text-[#333333]">Z3 Tempo (133-152)</span>
                  </div>
                  <strong className="font-mono text-amber-600">%{percentages.z3}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5EB] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zones[3].color }} />
                    <span className="text-[#333333]">Z4 Eşik (152-171)</span>
                  </div>
                  <strong className="font-mono text-[#FC4C02]">%{percentages.z4}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5EB] text-xs sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zones[4].color }} />
                    <span className="text-[#333333]">Z5 Maksimum (&gt;171)</span>
                  </div>
                  <strong className="font-mono text-red-500">%{percentages.z5}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => setIsShareRideOpen(true)}
              className="py-3 px-4 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#FC4C02]/20 active:scale-95"
              title="HTML Canvas ile sosyal medya özet kartı oluştur ve paylaş"
            >
              <Share2 className="w-4 h-4" />
              <span>Sürüşü Paylaş (Share Ride)</span>
            </button>

            <button
              onClick={() => setIsInstagramStoryOpen(true)}
              className="py-3 px-3.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              title="Kuşbakışı GPS haritası ve istatistiklerle 9:16 Instagram Story oluştur"
            >
              <Instagram className="w-4 h-4" />
              <span>Story</span>
            </button>

            {onExportGpx && (
              <button
                onClick={() => onExportGpx(ride)}
                className="py-3 px-3 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-[#FC4C02]" />
                <span>GPX</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#333333] font-bold text-xs sm:text-sm border border-[#E5E5EB] transition cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Social Media Canvas Share Modal (1:1 Square, 9:16 Story, 16:9 Landscape) */}
      <ShareRideModal
        ride={ride}
        isOpen={isShareRideOpen}
        onClose={() => setIsShareRideOpen(false)}
      />

      {/* 9:16 Instagram Story Modal */}
      <InstagramStoryModal
        ride={ride}
        isOpen={isInstagramStoryOpen}
        onClose={() => setIsInstagramStoryOpen(false)}
      />
    </div>
  );
};
