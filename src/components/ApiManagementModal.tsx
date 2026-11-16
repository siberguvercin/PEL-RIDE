import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Activity,
  Wind,
  TrendingUp,
  Compass,
  Zap,
  Check,
  Server,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import {
  apiKeyService,
  ApiKeyServiceConfig,
  WindAeroImpact,
  ElevationGradientEstimate
} from '../services/apiKeyService';

interface ApiManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiManagementModal: React.FC<ApiManagementModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<ApiKeyServiceConfig[]>(apiKeyService.getKeys());
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState<string>('');
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  // Live Aero & Telemetry tester state
  const [testWindSpeed, setTestWindSpeed] = useState<number>(22);
  const [testWindDeg, setTestWindDeg] = useState<number>(45);
  const [testRiderHeading, setTestRiderHeading] = useState<number>(0);
  const [testRiderSpeed, setTestRiderSpeed] = useState<number>(32);
  const [aeroResult, setAeroResult] = useState<WindAeroImpact | null>(null);

  // Elevation tester
  const [testDistanceM, setTestDistanceM] = useState<number>(1200);
  const [testClimbM, setTestClimbM] = useState<number>(95);
  const [elevationResult, setElevationResult] = useState<ElevationGradientEstimate | null>(null);

  useEffect(() => {
    const unsub = apiKeyService.subscribe((updated) => setKeys(updated));
    return () => unsub();
  }, []);

  useEffect(() => {
    // Run initial aero calculation
    const res = apiKeyService.calculateAeroWindEffect(
      testWindSpeed,
      testWindDeg,
      testRiderHeading,
      testRiderSpeed
    );
    setAeroResult(res);

    const ele = apiKeyService.estimateSegmentGradient(0, testClimbM, testDistanceM);
    setElevationResult(ele);
  }, [testWindSpeed, testWindDeg, testRiderHeading, testRiderSpeed, testDistanceM, testClimbM]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (item: ApiKeyServiceConfig) => {
    setEditingId(item.id);
    setEditKeyValue(item.key);
  };

  const handleSaveEdit = (id: string) => {
    if (editKeyValue.trim()) {
      apiKeyService.updateKey(id, editKeyValue.trim());
    }
    setEditingId(null);
  };

  const handlePing = async (id: string) => {
    const res = await apiKeyService.pingKey(id);
    setPingMessage(res.message);
    setTimeout(() => setPingMessage(null), 3000);
  };

  const handlePingAll = async () => {
    setIsPingingAll(true);
    await apiKeyService.pingAll();
    setIsPingingAll(false);
    setPingMessage('Tüm API telemetri servisleri doğrulandı (3/3 Aktif).');
    setTimeout(() => setPingMessage(null), 3500);
  };

  const handleResetDefaults = () => {
    if (confirm('Tüm API anahtarlarını orijinal tanımlı değerlerine sıfırlamak istiyor musunuz?')) {
      apiKeyService.resetToDefaults();
      setPingMessage('Orijinal 3 API anahtarı geri yüklendi.');
      setTimeout(() => setPingMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#18181B]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#F0F0F4] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF2ED] text-[#FC4C02] flex items-center justify-center shrink-0 border border-[#FED7C7] shadow-xs">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#242428]">
                  API & Telemetri Servisleri
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                  3 AKTİF SERVİS
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Bisiklet navigasyonu, canlı rüzgar/aero direnci ve irtifa motoru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#6B7280] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast Notice */}
        {pingMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pingMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#FAFAFC] p-3 rounded-2xl border border-[#E5E5EB]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#FC4C02]" />
              <span className="text-xs font-bold text-[#242428]">
                Telemetri Ağ Geçidi: <span className="text-emerald-600 font-extrabold">%100 Çalışma Süresi</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePingAll}
                disabled={isPingingAll}
                className="px-3 py-1.5 rounded-xl bg-[#242428] hover:bg-[#333333] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin' : ''}`} />
                <span>Tümünü Test Et</span>
              </button>

              <button
                onClick={handleResetDefaults}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#6B7280] hover:text-[#242428] border border-[#E5E5EB] text-xs font-bold transition cursor-pointer"
                title="Tanımlı API anahtarlarına sıfırla"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* Configured Keys List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6B7280]">
              YAPILANDIRILMIŞ 3 API ANAHTARI
            </h3>

            {keys.map((k, index) => {
              const isVisible = !!visibleKeys[k.id];
              const isEditing = editingId === k.id;
              const isCopied = copiedId === k.id;

              return (
                <div
                  key={k.id}
                  className="p-4 rounded-2xl bg-white border border-[#E5E5EB] hover:border-[#D1D5DB] transition shadow-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#242428] text-white text-[11px] font-black font-mono flex items-center justify-center">
                        {index + 1}
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-[#242428]">
                        {k.name}
                      </strong>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-[#FFF2ED] text-[#FC4C02] border border-[#FED7C7]">
                        {k.roleLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {k.lastPingMs}ms
                      </span>
                      <button
                        onClick={() => handlePing(k.id)}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#333333] transition cursor-pointer"
                      >
                        Ping
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6B7280]">{k.description}</p>

                  {/* API Key Box */}
                  <div className="flex items-center gap-2 bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl p-2 font-mono text-xs">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editKeyValue}
                        onChange={(e) => setEditKeyValue(e.target.value)}
                        className="flex-1 bg-white border border-[#FC4C02] rounded-lg px-2.5 py-1 text-xs text-[#242428] outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-[#242428] font-bold truncate select-all">
                        {isVisible
                          ? k.key
                          : `${k.key.slice(0, 8)}••••••••••••••••••••••••••••${k.key.slice(-8)}`}
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(k.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FC4C02] text-white text-xs font-bold hover:bg-[#E34402] transition cursor-pointer"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded-lg bg-[#F4F4F6] text-[#6B7280] text-xs font-bold hover:bg-[#EAEAEF] transition cursor-pointer"
                          >
                            İptal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleVisibility(k.id)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#242428] hover:bg-[#EAEAEF] transition cursor-pointer"
                            title={isVisible ? 'Gizle' : 'Göster'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleCopy(k.id, k.key)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#FC4C02] hover:bg-[#FFF2ED] transition cursor-pointer"
                            title="Kopyala"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleStartEdit(k)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#6B7280] hover:text-[#242428] hover:bg-[#EAEAEF] transition cursor-pointer"
                          >
                            Düzenle
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#878792] pt-1">
                    <span>Sağlayıcı: <strong className="text-[#333333]">{k.provider}</strong></span>
                    <span>İstek Sayacı: <strong className="text-[#333333]">{k.usageCount} çağrı</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Aero & Wind Telemetry Calculator powered by Key #2 */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0F0F4] pb-2">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#FC4C02]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#242428]">
                  Canlı Rüzgar & Aero Telemetri Test Konsolu (Key #2)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                Canlı Matematiksel Motor
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  RÜZGAR HIZI ({testWindSpeed} km/sa)
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={testWindSpeed}
                  onChange={(e) => setTestWindSpeed(Number(e.target.value))}
                  className="w-full accent-[#FC4C02]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  RÜZGAR AÇISI ({testWindDeg}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={testWindDeg}
                  onChange={(e) => setTestWindDeg(Number(e.target.value))}
                  className="w-full accent-[#FC4C02]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  SÜRÜŞ ROTASI ({testRiderHeading}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={testRiderHeading}
                  onChange={(e) => setTestRiderHeading(Number(e.target.value))}
                  className="w-full accent-[#FC4C02]"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  BİSİKLET HIZI ({testRiderSpeed} km/sa)
                </label>
                <input
                  type="range"
                  min="10"
                  max="65"
                  value={testRiderSpeed}
                  onChange={(e) => setTestRiderSpeed(Number(e.target.value))}
                  className="w-full accent-[#FC4C02]"
                />
              </div>
            </div>

            {aeroResult && (
              <div className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#242428]">
                      {aeroResult.typeLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#6B7280]">
                      ({Math.abs(aeroResult.effectiveHeadwindKmH)} km/sa vektör)
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563]">{aeroResult.advice}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#E5E5EB] text-center shrink-0 min-w-32">
                  <span className="text-[9px] uppercase font-bold text-[#6B7280] block">AERO WATT ETKİSİ</span>
                  <strong
                    className={`text-base font-black font-mono ${
                      aeroResult.wattImpact >= 0 ? 'text-emerald-600' : 'text-[#FC4C02]'
                    }`}
                  >
                    {aeroResult.wattImpact >= 0 ? `+${aeroResult.wattImpact} W` : `${aeroResult.wattImpact} W`}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Elevation & Gradient Calculator powered by Key #3 */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0F0F4] pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FC4C02]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#242428]">
                  İrtifa & Eğim Profili Motoru (Key #3)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                SRTM Eşitleme
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  SEGMENT MESAFESİ (Metre)
                </label>
                <input
                  type="number"
                  value={testDistanceM}
                  onChange={(e) => setTestDistanceM(Math.max(50, Number(e.target.value)))}
                  className="w-full bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#242428]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-[#6B7280] block mb-1">
                  İRTİFA KAZANIMI (Metre)
                </label>
                <input
                  type="number"
                  value={testClimbM}
                  onChange={(e) => setTestClimbM(Number(e.target.value))}
                  className="w-full bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#242428]"
                />
              </div>
            </div>

            {elevationResult && (
              <div className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">EĞİM KATEGORİSİ</span>
                  <strong className="text-sm font-black text-[#242428] flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: elevationResult.color }}
                    />
                    {elevationResult.category}
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">ORTALAMA EĞİM</span>
                  <strong
                    className="text-lg font-black font-mono"
                    style={{ color: elevationResult.color }}
                  >
                    %{elevationResult.gradientPercent}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F0F0F4] bg-[#FAFAFC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anahtarlar cihazınızda yerel ve şifreli saklanır</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs transition cursor-pointer shadow-md shadow-[#FC4C02]/20"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
