import React, { useState } from 'react';
import {
  Zap,
  Radio,
  Wrench,
  Trophy,
  X,
  Heart,
  Gauge,
  Sliders,
  Share2,
  Key,
  Folder
} from 'lucide-react';

interface FloatingToolkitProps {
  onOpenSegments: () => void;
  onOpenSos: () => void;
  onOpenCoach: () => void;
  onOpenRadio: () => void;
  onOpenMaintenance: () => void;
  onOpenLeaderboard: () => void;
  onOpenBluetoothHr?: () => void;
  onOpenGarmin?: () => void;
  onOpenApiManagement?: () => void;
  onOpenCollections?: () => void;
}

export const FloatingToolkit: React.FC<FloatingToolkitProps> = ({
  onOpenSegments,
  onOpenSos,
  onOpenCoach,
  onOpenRadio,
  onOpenMaintenance,
  onOpenLeaderboard,
  onOpenBluetoothHr,
  onOpenGarmin,
  onOpenApiManagement,
  onOpenCollections
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-30 flex flex-col items-end">
      {/* Expanded Tools Menu */}
      {isOpen && (
        <div className="mb-3 p-2.5 bg-white border border-[#E5E5EB] rounded-2xl shadow-2xl flex flex-col gap-1.5 w-72 max-h-[65vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-3 py-2 border-b border-[#E5E5EB] flex items-center justify-between text-xs font-black uppercase text-[#878792]">
            <span>PEL PRO ARAÇLAR</span>
            <span className="text-[10px] text-[#FC4C02] font-bold">Hızlı Erişim</span>
          </div>

          {/* 1. Live Segments */}
          <button
            onClick={() => {
              onOpenSegments();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Canlı KOM Segmentleri</div>
              <div className="text-[10px] text-[#878792]">Canlı HUD pacer</div>
            </div>
          </button>

          {/* 2. Beacon & Safety */}
          <button
            onClick={() => {
              onOpenSos();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Beacon Canlı Güvenlik</div>
              <div className="text-[10px] text-[#878792]">Canlı konum & güvenlik kontrolü</div>
            </div>
          </button>

          {/* 3. Performans Koçu & PSI */}
          <button
            onClick={() => {
              onOpenCoach();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFF2ED] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#242428] text-[#FC4C02] flex items-center justify-center shrink-0">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Sürüş Koçu & Lastik PSI</div>
              <div className="text-[10px] text-[#878792]">Antrenman analizi, beslenme & basınç</div>
            </div>
          </button>

          {/* 4. Peloton Radio & Tactical Horns */}
          <button
            onClick={() => {
              onOpenRadio();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F4F4F6] text-[#242428] flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Grup Telsizi & Sinyaller</div>
              <div className="text-[10px] text-[#878792]">Canlı ikaz düdükleri ve ses</div>
            </div>
          </button>

          {/* 5. Garage & Maintenance */}
          <button
            onClick={() => {
              onOpenMaintenance();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F4F4F6] text-[#242428] flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Garaj & Ekipman Bakımı</div>
              <div className="text-[10px] text-[#878792]">Zincir ve lastik aşınma sayacı</div>
            </div>
          </button>

          {/* 6. Global Leaderboard */}
          <button
            onClick={() => {
              onOpenLeaderboard();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F4F4F6] text-[#242428] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#242428]">Liderlik Tablosu</div>
              <div className="text-[10px] text-[#878792]">Küresel sıralama & puanlar</div>
            </div>
          </button>

          {/* 7. Route Collections */}
          {onOpenCollections && (
            <button
              onClick={() => {
                onOpenCollections();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFF2ED] text-left transition text-xs font-bold text-[#242428] cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#FC4C02]">Rota Koleksiyonları</div>
                <div className="text-[10px] text-[#878792]">Favoriler & haftalık hedefler</div>
              </div>
            </button>
          )}

          {/* 7. Bluetooth Heart Rate Monitor */}
          {onOpenBluetoothHr && (
            <button
              onClick={() => {
                onOpenBluetoothHr();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-left transition text-xs font-bold text-[#242428] cursor-pointer border-t border-[#E5E5EB]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="font-bold text-[#FC4C02]">Bluetooth Nabız Bandı</div>
                <div className="text-[10px] text-[#878792]">GATT eşleştirme & canlı BPM</div>
              </div>
            </button>
          )}

          {/* 8. Garmin Connect Integration */}
          {onOpenGarmin && (
            <button
              onClick={() => {
                onOpenGarmin();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F0F7FB] text-left transition text-xs font-bold text-[#242428] cursor-pointer border-t border-[#E5E5EB]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#007AC2] flex items-center justify-center shrink-0 font-black text-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L3 18h18L12 2zm0 4.2L17.5 15H6.5L12 6.2z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-[#007AC2] flex items-center gap-1.5">
                  <span>Garmin Connect™</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-[#878792]">Edge & GCDC token senkronu</div>
              </div>
            </button>
          )}

          {/* 9. API & Telemetri Yönetimi */}
          {onOpenApiManagement && (
            <button
              onClick={() => {
                onOpenApiManagement();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFF5F0] text-left transition text-xs font-bold text-[#242428] cursor-pointer border-t border-[#E5E5EB]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0 font-black text-xs border border-[#FED7C7]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#FC4C02] flex items-center gap-1.5">
                  <span>3x API Servisi</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-[#878792]">Navigasyon, Rüzgar & İrtifa</div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Floating Trigger Button in Pro Orange */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer transform active:scale-95 ${
          isOpen
            ? 'bg-[#242428] text-white rotate-90 ring-4 ring-[#E5E5EB]'
            : 'bg-[#FC4C02] hover:bg-[#E34402] text-white shadow-[#FC4C02]/25 ring-2 ring-white'
        }`}
        title="PEL Pro Araçları"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
      </button>
    </div>
  );
};
