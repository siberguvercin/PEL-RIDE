import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bluetooth,
  Battery,
  X,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Power
} from 'lucide-react';
import { bluetoothHrService } from '../services/bluetoothHrService';
import { HeartRateSensorState } from '../types';
import { getCurrentZone, getHeartRateZones, DEFAULT_MAX_HR } from '../utils/heartRate';

interface BluetoothHrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothHrModal: React.FC<BluetoothHrModalProps> = ({
  isOpen,
  onClose
}) => {
  const [hrState, setHrState] = useState<HeartRateSensorState>(bluetoothHrService.getState());
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customMaxHr, setCustomMaxHr] = useState<number>(hrState.maxHeartRateSetting || DEFAULT_MAX_HR);

  useEffect(() => {
    const unsubscribe = bluetoothHrService.subscribe((s) => {
      setHrState(s);
      setCustomMaxHr(s.maxHeartRateSetting);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const isWebBleSupported = bluetoothHrService.isWebBluetoothSupported();
  const currentZone = getCurrentZone(hrState.currentBpm, customMaxHr);
  const zones = getHeartRateZones(customMaxHr);
  const pctOfMax = customMaxHr > 0 && hrState.currentBpm > 0
    ? Math.round((hrState.currentBpm / customMaxHr) * 100)
    : 0;

  // Pulse animation duration in seconds based on bpm
  const pulseDurationSec = hrState.currentBpm > 40
    ? (60 / hrState.currentBpm).toFixed(2)
    : '1.0';

  const handleConnectBle = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      await bluetoothHrService.connect();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setErrorMessage(err.message || 'Bluetooth cihazına bağlanılamadı.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleSimulation = () => {
    setErrorMessage(null);
    bluetoothHrService.toggleSimulation();
  };

  const handleDisconnect = () => {
    bluetoothHrService.disconnect();
  };

  const handleSaveMaxHr = (e: React.FormEvent) => {
    e.preventDefault();
    bluetoothHrService.setMaxHeartRate(customMaxHr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-[#E5E5EB] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-white border-b border-[#F0F0F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FC4C02] border border-orange-100 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-current animate-pulse text-[#FC4C02]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[#242428]">
                  Bluetooth Nabız Bandı (HRM)
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FC4C02] border border-orange-200">
                  BLE 0x180D
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Göğüs ve kol nabız sensörü eşleme
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Bağlantı Sorunu:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Device Status & Live Meter Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#FAFAFC] border border-[#E5E5EB] p-5 shadow-xs text-center">
            {/* Connection Status Pill */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hrState.isConnected
                      ? hrState.isSimulated
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-[#333333]">
                  {hrState.isConnected
                    ? hrState.isSimulated
                      ? 'Simülasyon Modu (Test HRM)'
                      : hrState.deviceName || 'Bluetooth HRM Bağlı'
                    : 'Cihaz Bağlı Değil'}
                </span>
              </div>

              {hrState.batteryLevel !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E5EB] text-xs font-mono text-[#333333]">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>%{hrState.batteryLevel}</span>
                </div>
              )}
            </div>

            {/* Live BPM Readout */}
            <div className="my-2 flex flex-col items-center justify-center">
              <div className="relative inline-flex items-center justify-center">
                <div
                  className="w-22 h-22 rounded-full flex items-center justify-center transition-transform"
                  style={{
                    backgroundColor: currentZone.bgLight,
                    animation: hrState.isConnected && hrState.currentBpm > 40
                      ? `hrBeat ${pulseDurationSec}s ease-in-out infinite`
                      : 'none'
                  }}
                >
                  <Heart
                    className="w-11 h-11 transition-colors duration-300 fill-current"
                    style={{ color: hrState.isConnected ? currentZone.color : '#9CA3AF' }}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-5xl sm:text-6xl font-black font-mono text-[#242428] tracking-tight">
                  {hrState.isConnected ? hrState.currentBpm : '--'}
                </div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-[#6B7280] mt-0.5">
                  BPM (ATIM / DAKİKA)
                </div>
              </div>

              {/* Zone Tag */}
              {hrState.isConnected && hrState.currentBpm > 40 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold"
                  style={{
                    borderColor: currentZone.color,
                    backgroundColor: currentZone.bgLight,
                    color: currentZone.color
                  }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{currentZone.name}</span>
                  <span className="opacity-80 font-mono">• %{pctOfMax} Maks</span>
                </div>
              )}
            </div>

            {/* Zone Spectrum Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-[#6B7280] px-1">
                <span>Z1</span>
                <span>Z2</span>
                <span>Z3</span>
                <span>Z4</span>
                <span>Z5</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EAEAEF] overflow-hidden flex p-0.5 gap-0.5">
                {zones.map((z) => (
                  <div
                    key={z.zone}
                    className="flex-1 h-full rounded-xs transition-all duration-300"
                    style={{
                      backgroundColor: z.color,
                      opacity: hrState.isConnected && currentZone.zone === z.zone ? 1 : 0.25,
                      transform: hrState.isConnected && currentZone.zone === z.zone ? 'scaleY(1.3)' : 'none'
                    }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#6B7280] pt-1">
                {hrState.isConnected && hrState.currentBpm > 40
                  ? currentZone.description
                  : 'Sensör bağlandığında nabız bölgesi burada canlı güncellenir.'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Scan BLE & Toggle Simulator */}
          <div className="space-y-2">
            {!hrState.isConnected ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleConnectBle}
                  disabled={isConnecting}
                  className="py-3 px-4 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Bluetooth className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Aranıyor...' : 'Bluetooth Nabız Bandı Ara'}</span>
                </button>

                <button
                  onClick={handleToggleSimulation}
                  className="py-3 px-4 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#333333] border border-[#E5E5EB] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#FC4C02]" />
                  <span>Test Simülatörünü Aç</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>Bağlantıyı Kes</span>
                </button>

                {hrState.isSimulated && (
                  <button
                    onClick={handleToggleSimulation}
                    className="py-3 px-4 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#333333] border border-[#E5E5EB] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-[#FC4C02]" />
                    <span>Simülasyonu Durdur</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Browser Web Bluetooth Compatibility Note */}
          {!isWebBleSupported && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Web Bluetooth Desteği:</strong>
                <span>
                  Bu tarayıcıda doğrudan donanım aramak için Chrome veya Edge önerilir. Hemen denemek için "Test Simülatörünü Aç" butonunu kullanabilirsiniz.
                </span>
              </div>
            </div>
          )}

          {/* Max Heart Rate Setting */}
          <div className="bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FC4C02]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#242428]">
                  Maksimum Kalp Atış Hızı Ayarı
                </h3>
              </div>
              <span className="text-xs font-mono text-[#FC4C02] font-bold">{customMaxHr} BPM</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mb-3">
              Kişiselleştirilmiş nabız bölgeleri için maksimum nabzınızı belirleyin (220 - Yaş).
            </p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="140"
                max="220"
                value={customMaxHr}
                onChange={(e) => setCustomMaxHr(parseInt(e.target.value, 10))}
                className="flex-1 accent-[#FC4C02] cursor-pointer"
              />
              <button
                type="button"
                onClick={handleSaveMaxHr}
                className="px-3 py-1.5 rounded-lg bg-[#FC4C02] text-white text-xs font-bold transition"
              >
                Kaydet
              </button>
            </div>
          </div>

          {/* Supported Hardware Brands */}
          <div className="bg-[#FAFAFC] border border-[#E5E5EB] rounded-xl p-3.5 text-xs text-[#6B7280] space-y-1.5">
            <div className="font-bold text-[#242428] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Desteklenen Sensörler:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Garmin (HRM-Pro, HRM-Dual), Polar (H10, H9, Verity Sense), Wahoo TICKR, Magene, CooSpo, Decathlon ve Apple Watch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
