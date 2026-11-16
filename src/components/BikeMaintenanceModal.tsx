import React, { useState } from 'react';
import {
  X,
  Wrench,
  RotateCcw,
  Plus,
  Bike,
  Calendar
} from 'lucide-react';

interface BikeProfile {
  id: string;
  name: string;
  type: 'Yol' | 'Gravel' | 'MTB';
  totalKm: number;
  chainKm: number;
  chainLimitKm: number;
  tiresKm: number;
  tiresLimitKm: number;
  brakePadsKm: number;
  brakeLimitKm: number;
  tubelessDaysLeft: number;
  notes: string;
}

interface ServiceLog {
  id: string;
  bikeName: string;
  component: string;
  date: string;
  note: string;
}

interface BikeMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BikeMaintenanceModal: React.FC<BikeMaintenanceModalProps> = ({
  isOpen,
  onClose
}) => {
  const [bikes, setBikes] = useState<BikeProfile[]>(() => {
    const saved = localStorage.getItem('pel_bikes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: 'bike-1',
        name: 'Specialized S-Works Tarmac SL8',
        type: 'Yol',
        totalKm: 3420,
        chainKm: 1850,
        chainLimitKm: 3000,
        tiresKm: 2100,
        tiresLimitKm: 4500,
        brakePadsKm: 1400,
        brakeLimitKm: 2500,
        tubelessDaysLeft: 28,
        notes: 'Shimano Dura-Ace Di2 12s, Roval Rapide CLX jantlar'
      },
      {
        id: 'bike-2',
        name: 'Canyon Grizl CF SL 8',
        type: 'Gravel',
        totalKm: 1250,
        chainKm: 890,
        chainLimitKm: 3000,
        tiresKm: 1250,
        tiresLimitKm: 4000,
        brakePadsKm: 890,
        brakeLimitKm: 2200,
        tubelessDaysLeft: 64,
        notes: 'SRAM Rival eTap AXS 1x12, Maxxis Rambler 45c'
      }
    ];
  });

  const [activeBikeId, setActiveBikeId] = useState<string>('bike-1');

  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>(() => {
    const saved = localStorage.getItem('pel_service_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      {
        id: 'log-1',
        bikeName: 'Specialized S-Works Tarmac SL8',
        component: 'Zincir Değişimi & Yağlama',
        date: '12 Ekim 2026',
        note: 'Yeni KMC DLC 12s zincir takıldı.'
      },
      {
        id: 'log-2',
        bikeName: 'Canyon Grizl CF SL 8',
        component: 'Tubeless Sıvı Tazeleme',
        date: '28 Eylül 2026',
        note: '60ml Stan’s NoTubes Race Sealant eklendi.'
      }
    ];
  });

  const [showAddBikeModal, setShowAddBikeModal] = useState<boolean>(false);
  const [newBikeName, setNewBikeName] = useState<string>('');
  const [newBikeType, setNewBikeType] = useState<'Yol' | 'Gravel' | 'MTB'>('Yol');

  if (!isOpen) return null;

  const currentBike = bikes.find((b) => b.id === activeBikeId) || bikes[0];

  const saveBikes = (newBikes: BikeProfile[]) => {
    setBikes(newBikes);
    localStorage.setItem('pel_bikes', JSON.stringify(newBikes));
  };

  const saveLogs = (newLogs: ServiceLog[]) => {
    setServiceLogs(newLogs);
    localStorage.setItem('pel_service_logs', JSON.stringify(newLogs));
  };

  const handleResetComponent = (componentName: string, field: 'chain' | 'tires' | 'brakes' | 'tubeless') => {
    const updated = bikes.map((b) => {
      if (b.id === currentBike.id) {
        if (field === 'chain') return { ...b, chainKm: 0 };
        if (field === 'tires') return { ...b, tiresKm: 0 };
        if (field === 'brakes') return { ...b, brakePadsKm: 0 };
        if (field === 'tubeless') return { ...b, tubelessDaysLeft: 90 };
      }
      return b;
    });
    saveBikes(updated);

    const newLog: ServiceLog = {
      id: 'log-' + Date.now(),
      bikeName: currentBike.name,
      component: componentName,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      note: 'Bakım yapıldı, sayaç sıfırlandı.'
    };
    saveLogs([newLog, ...serviceLogs]);
  };

  const handleAddBike = () => {
    if (!newBikeName.trim()) return;
    const newBike: BikeProfile = {
      id: 'bike-' + Date.now(),
      name: newBikeName.trim(),
      type: newBikeType,
      totalKm: 0,
      chainKm: 0,
      chainLimitKm: 3000,
      tiresKm: 0,
      tiresLimitKm: newBikeType === 'MTB' ? 3500 : 4500,
      brakePadsKm: 0,
      brakeLimitKm: 2500,
      tubelessDaysLeft: 90,
      notes: 'Yeni bisiklet profili.'
    };
    const updated = [...bikes, newBike];
    saveBikes(updated);
    setActiveBikeId(newBike.id);
    setNewBikeName('');
    setShowAddBikeModal(false);
  };

  const chainPct = Math.min(100, Math.round((currentBike.chainKm / currentBike.chainLimitKm) * 100));
  const tiresPct = Math.min(100, Math.round((currentBike.tiresKm / currentBike.tiresLimitKm) * 100));
  const brakesPct = Math.min(100, Math.round((currentBike.brakePadsKm / currentBike.brakeLimitKm) * 100));

  const getProgressColor = (pct: number) => {
    if (pct >= 85) return 'bg-[#FC4C02]';
    if (pct >= 65) return 'bg-amber-500';
    return 'bg-[#242428]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2ED] flex items-center justify-center text-[#FC4C02]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#242428] flex items-center gap-2">
                Bisiklet Garajı & Ekipman Bakımı
              </h2>
              <p className="text-xs text-[#878792]">Zincir, Lastik ve Balata Aşınma Takipçisi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bike Switcher Bar */}
        <div className="p-3 bg-[#F7F7FA] border-b border-[#E5E5EB] flex items-center gap-2 overflow-x-auto">
          {bikes.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBikeId(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                b.id === currentBike.id
                  ? 'bg-[#FC4C02] text-white shadow-sm'
                  : 'bg-white text-[#494950] border border-[#E5E5EB] hover:bg-[#F4F4F6]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              {b.name}
            </button>
          ))}

          <button
            onClick={() => setShowAddBikeModal(true)}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#D1D1D8] text-[#878792] hover:text-[#FC4C02] text-xs font-bold flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Bisiklet Ekle
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Add Bike Form */}
          {showAddBikeModal && (
            <div className="p-4 bg-[#F7F7FA] border border-[#E5E5EB] rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-[#242428] uppercase">Yeni Bisiklet Tanımla</h3>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Bisiklet Modeli (Örn: Trek Emonda)"
                  value={newBikeName}
                  onChange={(e) => setNewBikeName(e.target.value)}
                  className="col-span-2 bg-white border border-[#E5E5EB] rounded-xl px-3 py-1.5 text-xs text-[#242428]"
                />
                <select
                  value={newBikeType}
                  onChange={(e) => setNewBikeType(e.target.value as any)}
                  className="bg-white border border-[#E5E5EB] rounded-xl px-2 py-1.5 text-xs text-[#242428]"
                >
                  <option value="Yol">Yol Bisikleti</option>
                  <option value="Gravel">Gravel</option>
                  <option value="MTB">Dağ Bisikleti</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddBike}
                  className="flex-1 py-1.5 rounded-xl bg-[#FC4C02] text-white text-xs font-bold cursor-pointer hover:bg-[#E34402]"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setShowAddBikeModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E5EB] text-[#878792] text-xs font-bold cursor-pointer"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Bike Overview Card */}
          <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FFF2ED] text-[#FC4C02]">
                  {currentBike.type}
                </span>
                <h3 className="text-base font-extrabold text-[#242428]">{currentBike.name}</h3>
              </div>
              <p className="text-xs text-[#878792] mt-1">{currentBike.notes}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#878792] block uppercase font-bold">Toplam Mesafe</span>
              <span className="text-xl font-black text-[#242428] font-mono">{currentBike.totalKm} km</span>
            </div>
          </div>

          {/* Wear & Tear Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-[#878792] tracking-wider flex items-center justify-between">
              <span>BİLEŞEN AŞINMA DURUMU</span>
              <span className="text-[10px] text-[#FC4C02] font-bold">Kilometre Takibi</span>
            </h4>

            {/* 1. Chain */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#242428] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FC4C02]" />
                  Zincir Aşınması (%0.5 Sınır)
                </span>
                <span className="text-xs font-mono font-bold text-[#242428]">
                  {currentBike.chainKm} / {currentBike.chainLimitKm} km ({chainPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EBEBEF] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(chainPct)}`}
                  style={{ width: `${chainPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#878792]">
                  {chainPct > 80 ? '⚠️ Zincir uzamış, kaseti korumak için yenileyin.' : 'Zincir durumu normal.'}
                </span>
                <button
                  onClick={() => handleResetComponent('Zincir Değişimi & Yağlama', 'chain')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F7FA] hover:bg-[#EBEBEF] border border-[#E5E5EB] text-xs font-bold text-[#242428] flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </div>

            {/* 2. Tires */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#242428] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#242428]" />
                  Lastik Diş Ömrü
                </span>
                <span className="text-xs font-mono font-bold text-[#242428]">
                  {currentBike.tiresKm} / {currentBike.tiresLimitKm} km ({tiresPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EBEBEF] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(tiresPct)}`}
                  style={{ width: `${tiresPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#878792]">
                  Kalan tahmini ömür: {currentBike.tiresLimitKm - currentBike.tiresKm} km
                </span>
                <button
                  onClick={() => handleResetComponent('Yeni Dış Lastik Takımı', 'tires')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F7FA] hover:bg-[#EBEBEF] border border-[#E5E5EB] text-xs font-bold text-[#242428] flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </div>

            {/* 3. Brake Pads */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#242428] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Fren Balataları
                </span>
                <span className="text-xs font-mono font-bold text-[#242428]">
                  {currentBike.brakePadsKm} / {currentBike.brakeLimitKm} km ({brakesPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EBEBEF] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(brakesPct)}`}
                  style={{ width: `${brakesPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#878792]">
                  Balata kalınlığı &gt; 1.5mm olmalıdır.
                </span>
                <button
                  onClick={() => handleResetComponent('Fren Balatası Değişimi', 'brakes')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F7FA] hover:bg-[#EBEBEF] border border-[#E5E5EB] text-xs font-bold text-[#242428] flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </div>

            {/* 4. Tubeless Sealant */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-[#242428] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FC4C02]" />
                  Tubeless Sıvı Kuruma Geri Sayımı
                </span>
                <p className="text-[11px] text-[#878792] mt-0.5">
                  Her 90 günde bir 50-60ml taze sıvı eklenmelidir.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-base font-black text-[#FC4C02] font-mono">
                    {currentBike.tubelessDaysLeft} gün
                  </span>
                  <span className="text-[10px] text-[#878792] block">kaldı</span>
                </div>
                <button
                  onClick={() => handleResetComponent('Tubeless Sıvı Eklendi', 'tubeless')}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F7FA] hover:bg-[#EBEBEF] border border-[#E5E5EB] text-xs font-bold text-[#242428] flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </div>
          </div>

          {/* Service Log History */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-[#878792] tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              SERVİS GÜNLÜĞÜ
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {serviceLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#242428]">{log.component}</span>
                    <span className="text-[#878792] text-[11px] block">{log.note}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#878792] shrink-0">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
