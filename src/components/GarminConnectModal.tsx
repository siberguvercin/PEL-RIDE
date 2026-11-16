import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Radio,
  Heart,
  BatteryCharging,
  Key,
  Download,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { garminService, GarminAuthState, GarminDevice } from '../services/garminService';
import { SavedRide } from '../types';

interface GarminConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRides: SavedRide[];
}

export const GarminConnectModal: React.FC<GarminConnectModalProps> = ({
  isOpen,
  onClose,
  savedRides
}) => {
  const [garminState, setGarminState] = useState<GarminAuthState>(garminService.getState());
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState(garminState.token);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    const unsub = garminService.subscribe((s) => {
      setGarminState(s);
      setTokenInput(s.token);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSaveToken = () => {
    if (!tokenInput.trim()) return;
    garminService.updateToken(tokenInput.trim());
    setIsEditingToken(false);
    showToast('Garmin API tokenı başarıyla güncellendi ve doğrulandı!');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(garminState.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const count = await garminService.syncAll(savedRides);
      showToast(
        count > 0
          ? `${count} yeni sürüş Garmin Connect™ hesabınıza aktarıldı!`
          : 'Tüm aktiviteleriniz Garmin Connect™ ile güncel durumda.'
      );
    } catch (_) {
      showToast('Eşitleme sırasında bir hata oluştu.');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const getDeviceIcon = (type: GarminDevice['type']) => {
    switch (type) {
      case 'edge':
        return <Cpu className="w-4 h-4 text-[#007AC2]" />;
      case 'hrm':
        return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'radar':
        return <Radio className="w-4 h-4 text-[#FC4C02]" />;
      case 'power':
        return <Zap className="w-4 h-4 text-amber-500 fill-current" />;
      default:
        return <Activity className="w-4 h-4 text-[#007AC2]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AC2] flex items-center justify-center text-white font-black text-lg shadow-sm">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L3 18h18L12 2zm0 4.2L17.5 15H6.5L12 6.2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-[#242428]">
                  Garmin Connect™
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  API BAĞLI
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Bisiklet bilgisayarı, radar ve telemetri veri köprüsü
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#6B7280] hover:text-[#242428] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Toast Notification */}
        {syncToast && (
          <div className="bg-[#007AC2] text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {syncToast}
            </span>
            <button onClick={() => setSyncToast(null)} className="cursor-pointer text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F7F7FA]">
          {/* Active Garmin Account & GCDC Token Card */}
          <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0F0F4]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#007AC2]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242428]">
                  Garmin Connect API Kimlik Bilgisi (GCDC Ticket)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Yetkilendirildi
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#6B7280]">Bağlı Garmin Hesabı:</span>
                  <span className="font-bold text-[#242428]">{garminState.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Garmin Sporcu Kimliği:</span>
                  <span className="font-mono text-[11px] font-bold text-[#007AC2]">
                    {garminState.athleteId}
                  </span>
                </div>
              </div>

              {/* Token Snippet / Edit */}
              <div className="bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[#6B7280]">
                    Garmin API Token (GCDC Session):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyToken}
                      className="text-[11px] text-[#007AC2] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditingToken(!isEditingToken)}
                      className="text-[11px] text-[#FC4C02] hover:underline font-semibold cursor-pointer"
                    >
                      {isEditingToken ? 'İptal' : 'Düzenle'}
                    </button>
                  </div>
                </div>

                {isEditingToken ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      rows={3}
                      className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#007AC2] bg-white text-[#242428] focus:outline-hidden ring-2 ring-[#007AC2]/20"
                      placeholder="GCDC_... ile başlayan Garmin API tokenınızı buraya yapıştırın"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setTokenInput(garminState.token);
                          setIsEditingToken(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F4F4F6] text-xs font-bold text-[#6B7280] hover:bg-[#EAEAEF]"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={handleSaveToken}
                        className="px-3 py-1.5 rounded-lg bg-[#007AC2] hover:bg-[#0066A3] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Kaydet & Doğrula
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-[#242428] bg-white p-2 rounded-lg border border-[#E5E5EB] break-all select-all">
                    {garminState.token}
                  </div>
                )}
              </div>

              {/* Auto Upload Setting */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0F7FB] border border-[#BCE1F5]">
                <div className="pr-4">
                  <div className="text-xs font-extrabold text-[#007AC2]">
                    Otomatik Garmin Connect™ Eşitlemesi
                  </div>
                  <div className="text-[11px] text-[#4A5568]">
                    Sürüş bitirildiğinde Garmin hesabınıza otomatik TCX/FIT olarak aktarılır.
                  </div>
                </div>
                <button
                  onClick={() => garminService.setAutoUpload(!garminState.autoUploadRides)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    garminState.autoUploadRides ? 'bg-[#007AC2]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                      garminState.autoUploadRides ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Connected Garmin Hardware / Sensors */}
          <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0F0F4]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#007AC2]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242428]">
                  Eşleştirilmiş Garmin Cihazları ({garminState.devices.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#6B7280]">ANT+ & BLE Dual</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {garminState.devices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] flex items-start justify-between gap-2 hover:border-[#007AC2]/40 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5EB] flex items-center justify-center shrink-0 mt-0.5">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#242428] leading-tight">
                        {device.name}
                      </div>
                      <div className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                        {device.model}
                      </div>
                      <div className="text-[9px] font-mono text-[#007AC2] mt-1 font-semibold">
                        {device.connectionProtocol} · {device.firmwareVersion}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <BatteryCharging className="w-3 h-3" />
                      {device.batteryPercent}%
                    </span>
                    <span className="text-[9px] text-[#878792] mt-1 font-medium">
                      {device.lastSeen}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Synced Activities / Manual Sync */}
          <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0F0F4]">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#242428]">
                  Garmin Connect™ Aktiviteleri
                </h3>
                <span className="text-[10px] text-[#6B7280]">
                  Son Eşitleme: {garminState.lastSyncTime || 'Az önce'}
                </span>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-[#007AC2] hover:bg-[#0066A3] disabled:opacity-60 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Eşitleniyor...' : 'Şimdi Eşitle'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {garminState.syncedActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-[#FAFAFC] border border-[#E5E5EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#242428]">{act.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#007AC2]/10 text-[#007AC2] font-bold">
                        {act.garminActivityId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-mono mt-1">
                      <span>{act.distanceKm} km</span>
                      <span>•</span>
                      <span>{Math.floor(act.durationSec / 60)} dk</span>
                      <span>•</span>
                      <span className="text-[#FC4C02] font-bold">+{act.climbM}m</span>
                      <span>•</span>
                      <span>Eşitlendi: {act.syncTimestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        const matched = savedRides.find((r) => r.title === act.title) || {
                          id: act.id,
                          title: act.title,
                          date: act.date,
                          distanceKm: act.distanceKm,
                          durationSec: act.durationSec,
                          avgSpeedKmH: 30,
                          maxSpeedKmH: 48,
                          climbM: act.climbM,
                          descentM: act.climbM - 10,
                          points: []
                        };
                        garminService.exportAsTcx(matched);
                        showToast('Garmin TCX dosyası indirildi!');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5EB] hover:bg-[#F4F4F6] text-[11px] font-bold text-[#007AC2] flex items-center gap-1 transition cursor-pointer"
                      title="Garmin TCX İndir"
                    >
                      <Download className="w-3 h-3" />
                      <span>TCX</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5EB] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Garmin Connect Cloud Senkronizasyonu Aktif</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#242428] hover:bg-[#1A1A1E] text-white text-xs font-bold transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
