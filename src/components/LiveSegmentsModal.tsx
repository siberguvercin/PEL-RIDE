import React, { useState } from 'react';
import {
  X,
  Trophy,
  Crown,
  MapPin,
  Play
} from 'lucide-react';

export interface LiveSegment {
  id: string;
  name: string;
  category: 'Sprint' | 'Tırmanış (KOM)' | 'Zaman Karşı' | 'Gravel Sektörü';
  distanceKm: number;
  avgGradePct: number;
  komTime: string;
  komHolder: string;
  myPrTime: string;
  startLat: number;
  startLng: number;
  description: string;
}

export const POPULAR_SEGMENTS: LiveSegment[] = [
  {
    id: 'seg-1',
    name: 'Belgrad Neşetsuyu Rampa Sprinti',
    category: 'Tırmanış (KOM)',
    distanceKm: 1.45,
    avgGradePct: 7.2,
    komTime: '03:14',
    komHolder: 'Caner Şen',
    myPrTime: '03:48',
    startLat: 41.178,
    startLng: 28.986,
    description: 'Virajlı orman içi sert rampa. 400W üzeri sprint ile KOM gelir.'
  },
  {
    id: 'seg-2',
    name: 'Caddebostan Sahil 2 Km Hız Koridoru',
    category: 'Sprint',
    distanceKm: 2.0,
    avgGradePct: 0.2,
    komTime: '02:26',
    komHolder: 'Burak Kaya',
    myPrTime: '02:44',
    startLat: 40.962,
    startLng: 29.065,
    description: 'Düz kaymak asfalt. Rüzgarı arkaya aldığınızda 52+ km/sa test parkuru.'
  },
  {
    id: 'seg-3',
    name: 'Bebek - Rumeli Hisarı Yokuşu',
    category: 'Tırmanış (KOM)',
    distanceKm: 0.95,
    avgGradePct: 11.4,
    komTime: '02:45',
    komHolder: 'Serkan Dağtekin',
    myPrTime: '03:20',
    startLat: 41.078,
    startLng: 29.043,
    description: 'İstanbulun en dik Boğaz yokuşlarından biri. Ayakta pedal çevirme testi.'
  },
  {
    id: 'seg-4',
    name: 'Urla Bağ Yolu Gravel Hızlı Etabı',
    category: 'Gravel Sektörü',
    distanceKm: 3.8,
    avgGradePct: 3.5,
    komTime: '06:12',
    komHolder: 'Elif Yılmaz',
    myPrTime: '07:05',
    startLat: 38.358,
    startLng: 26.772,
    description: 'Sıkıştırılmış toprak ve ince çakıl zemin. 40mm lastikle akıcı sürüş.'
  }
];

interface LiveSegmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSegmentLocation: (lat: number, lng: number) => void;
}

export const LiveSegmentsModal: React.FC<LiveSegmentsModalProps> = ({
  isOpen,
  onClose,
  onSelectSegmentLocation
}) => {
  const [activeSegment, setActiveSegment] = useState<LiveSegment | null>(POPULAR_SEGMENTS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simDeltaSec, setSimDeltaSec] = useState<number>(0);
  const [simResultMessage, setSimResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSimulation = (seg: LiveSegment) => {
    setActiveSegment(seg);
    setIsSimulating(true);
    setSimResultMessage(null);
    setSimDeltaSec(0);

    let latestDelta = 0;
    const interval = setInterval(() => {
      setSimDeltaSec((prev) => {
        const next = parseFloat((prev + (Math.random() > 0.45 ? 0.3 : -0.2)).toFixed(1));
        latestDelta = next;
        return next;
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsSimulating(false);
      setSimResultMessage(
        `${seg.name} tamamlandı! KOM'a göre fark: ${latestDelta > 0 ? '+' : ''}${latestDelta}s (+150 RP eklendi)`
      );
    }, 9000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF2ED] text-[#FC4C02]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#242428] flex items-center gap-2">
                Canlı KOM / QOM Segmentleri
                <span className="text-[10px] bg-[#FC4C02] text-white px-2 py-0.5 rounded font-black uppercase">
                  LIVE HUD
                </span>
              </h2>
              <p className="text-xs text-[#878792]">
                Segmentlere yaklaştığınızda canlı zaman farkı HUD ekranınızda akar
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

        {/* Simulation Result Banner */}
        {simResultMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2">
            <span>{simResultMessage}</span>
            <button onClick={() => setSimResultMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Segment Simulation HUD Bar */}
        {isSimulating && activeSegment && (
          <div className="bg-[#FFF8F5] border-b border-[#FC4C02]/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FC4C02] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FC4C02] animate-pulse" />
                CANLI SEGMENT YARIŞI DEVAM EDİYOR
              </span>
              <h3 className="text-sm font-black text-[#242428] mt-0.5">{activeSegment.name}</h3>
              <p className="text-xs text-[#878792]">
                KOM Hedef Süresi: <strong className="text-[#242428] font-mono">{activeSegment.komTime}</strong> ({activeSegment.komHolder})
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-[#E5E5EB] shadow-sm">
              <div className="text-center font-mono">
                <span className="text-[9px] uppercase font-bold text-[#878792] block font-sans">KOM FARKI</span>
                <span
                  className={`text-lg font-black ${
                    simDeltaSec <= 0 ? 'text-[#FC4C02]' : 'text-rose-600'
                  }`}
                >
                  {simDeltaSec <= 0 ? '' : '+'}{simDeltaSec.toFixed(1)}s
                </span>
              </div>
              <div className="text-[10px] font-bold px-2 py-1 rounded bg-[#FFF2ED] text-[#FC4C02]">
                {simDeltaSec <= 0 ? 'ÖNDESİN 🚀' : 'BASTIR! 🔥'}
              </div>
            </div>
          </div>
        )}

        {/* Segments Directory List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#F7F7FA]">
          {POPULAR_SEGMENTS.map((seg) => (
            <div
              key={seg.id}
              className="bg-white border border-[#E5E5EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#FC4C02]/40 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFF2ED] text-[#FC4C02]">
                    {seg.category}
                  </span>
                  <span className="text-xs font-mono text-[#878792]">
                    {seg.distanceKm} km · %{seg.avgGradePct} Eğim
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-[#242428]">{seg.name}</h4>
                <p className="text-xs text-[#6D6D78] mt-0.5">{seg.description}</p>

                <div className="flex items-center gap-3 text-xs font-mono mt-2 pt-2 border-t border-[#F0F0F2]">
                  <div className="flex items-center gap-1 text-[#242428]">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>KOM: <strong>{seg.komTime}</strong></span>
                    <span className="text-[10px] text-[#878792] truncate max-w-[140px]">({seg.komHolder})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-[#FC4C02]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Senin PR: <strong>{seg.myPrTime}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleStartSimulation(seg)}
                  disabled={isSimulating}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Segmenti Başlat</span>
                </button>

                <button
                  onClick={() => {
                    onSelectSegmentLocation(seg.startLat, seg.startLng);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] text-xs font-bold border border-[#E5E5EB] flex items-center justify-center gap-1 transition shadow-sm"
                  title="Haritada Başlangıç Noktasını Göster"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
                  <span>Haritada Gör</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
