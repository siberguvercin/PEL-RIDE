import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Phone,
  CheckCircle,
  Activity,
  Heart,
  Battery,
  MapPin,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { LatLng } from '../types';
import { socketService } from '../services/socket';

interface SafetySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LatLng | null;
  currentSpeed?: number;
}

export const SafetySosModal: React.FC<SafetySosModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentSpeed = 0
}) => {
  const [isCheckActive, setIsCheckActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [beaconSent, setBeaconSent] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(84);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<'high' | 'med' | 'low'>('med');

  // Contact info
  const [emergencyPhone, setEmergencyPhone] = useState<string>(() => {
    return localStorage.getItem('pel_emergency_phone') || '+90 532 000 0000';
  });
  const [emergencyContactName, setEmergencyContactName] = useState<string>(() => {
    return localStorage.getItem('pel_emergency_contact_name') || 'Acil Durum Yakını';
  });
  const [bloodType, setBloodType] = useState<string>(() => {
    return localStorage.getItem('pel_blood_type') || 'A Rh+';
  });
  const [medicalNotes, setMedicalNotes] = useState<string>(() => {
    return localStorage.getItem('pel_med_notes') || 'Kronik rahatsızlık veya ilaç alerjisi yok.';
  });

  // Read Battery API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        })
        .catch(() => {});
    }
  }, []);

  // Motion sensor for incident check
  useEffect(() => {
    if (!autoDetectEnabled) return;

    const threshold = sensitivity === 'high' ? 28 : sensitivity === 'med' ? 36 : 48;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const totalG = Math.sqrt(
        (acc.x || 0) * (acc.x || 0) +
        (acc.y || 0) * (acc.y || 0) +
        (acc.z || 0) * (acc.z || 0)
      );

      if (totalG > threshold && !isCheckActive && !beaconSent) {
        setIsCheckActive(true);
        setCountdown(30);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [autoDetectEnabled, sensitivity, isCheckActive, beaconSent]);

  // Countdown timer when incident check is active
  useEffect(() => {
    if (!isCheckActive) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleSendBeaconUpdate();
    }
  }, [isCheckActive, countdown]);

  const handleSendBeaconUpdate = () => {
    setIsCheckActive(false);
    setBeaconSent(true);

    const lat = currentLocation?.lat || 41.0082;
    const lng = currentLocation?.lng || 28.9784;

    socketService.sendEmergencySos({
      lat,
      lng,
      battery: batteryLevel || 80,
      message: `Beacon konum güncellemesi: Hız ${currentSpeed.toFixed(1)} km/s.`
    });

    socketService.sendChatMessage(
      `📍 Beacon Canlı Konumu: https://maps.google.com/?q=${lat},${lng}`,
      'global',
      undefined,
      undefined,
      'chat'
    );
  };

  const saveContactInfo = () => {
    localStorage.setItem('pel_emergency_phone', emergencyPhone);
    localStorage.setItem('pel_emergency_contact_name', emergencyContactName);
    localStorage.setItem('pel_blood_type', bloodType);
    localStorage.setItem('pel_med_notes', medicalNotes);
  };

  const lat = currentLocation?.lat || 41.0082;
  const lng = currentLocation?.lng || 28.9784;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const activeRiderName = socketService.getUser().name || 'Bisikletçi';
  const whatsappText = encodeURIComponent(
    `Beacon Canlı Takip Bağlantım:\nSürücü: ${activeRiderName}\nCanlı Konum: ${mapsLink}\nPil: %${batteryLevel || 85}`
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2ED] flex items-center justify-center text-[#FC4C02]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#242428] flex items-center gap-2">
                Beacon Canlı Güvenlik
              </h2>
              <p className="text-xs text-[#878792]">Canlı Konum Paylaşımı ve Güvenlik Takibi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Calm incident check if triggered */}
          {isCheckActive && (
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC4C02]/30 text-center space-y-2">
              <Clock className="w-8 h-8 text-[#FC4C02] mx-auto animate-pulse" />
              <h3 className="text-base font-extrabold text-[#242428]">Hareketsizlik Algılandı</h3>
              <p className="text-xs text-[#494950]">
                Durumunuz iyi mi? {countdown} saniye içinde onaylanmazsa acil durum kişisine Beacon konumu iletilecektir.
              </p>
              <div className="text-2xl font-black font-mono text-[#FC4C02]">
                {countdown} sn
              </div>
              <button
                onClick={() => setIsCheckActive(false)}
                className="w-full py-2.5 rounded-xl bg-[#242428] hover:bg-[#333333] text-white font-bold text-xs cursor-pointer transition"
              >
                İyiyim, Sürüşe Devam Ediyorum
              </button>
            </div>
          )}

          {/* Success state */}
          {beaconSent && (
            <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Beacon konumu başarıyla güncellendi.</span>
              </div>
              <button
                onClick={() => setBeaconSent(false)}
                className="font-bold underline cursor-pointer text-emerald-700"
              >
                Tamam
              </button>
            </div>
          )}

          {/* WhatsApp / SMS Beacon Share Card */}
          <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#242428] uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#FC4C02]" />
                Beacon Canlı Takip Bağlantısı
              </span>
              <span className="text-[11px] text-[#878792] font-mono flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" /> %{batteryLevel || 85} Pil
              </span>
            </div>

            <p className="text-xs text-[#494950] leading-relaxed">
              Belirlediğiniz güvenlik kişisi harita üzerinde canlı izinizi, anlık hızınızı ve pil seviyenizi tarayıcı üzerinden görüntüleyebilir.
            </p>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Phone className="w-4 h-4" /> Beacon Bağlantısını Paylaş
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mapsLink);
                  setBeaconSent(true);
                }}
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-[#F4F5F7] text-xs font-bold text-[#18181B] border border-[#E2E4E9] flex items-center gap-1.5 cursor-pointer transition"
              >
                <MapPin className="w-4 h-4 text-[#FC4C02]" /> Linki Kopyala
              </button>
            </div>
          </div>

          {/* Sensor Settings */}
          <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#242428] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#FC4C02]" />
                Darbe & Hareketsizlik Kontrolü
              </span>
              <button
                onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold cursor-pointer transition ${
                  autoDetectEnabled
                    ? 'bg-[#FFF2ED] text-[#FC4C02] border border-[#FC4C02]/30'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {autoDetectEnabled ? 'Açık' : 'Kapalı'}
              </button>
            </div>

            <p className="text-xs text-[#878792]">
              Sert bir sarsıntı sonrası durma tespit edilirse ekranınızda sakin bir güvenlik kontrolü başlatılır.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(['high', 'med', 'low'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    sensitivity === s
                      ? 'bg-[#242428] text-white border-[#242428]'
                      : 'bg-white text-[#494950] border-[#E5E5EB] hover:bg-[#F4F4F6]'
                  }`}
                >
                  {s === 'high' ? 'Hassas (MTB)' : s === 'med' ? 'Dengeli (Yol)' : 'Düşük'}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact & Medical Info */}
          <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-3">
            <span className="text-xs font-bold text-[#242428] uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#FC4C02]" />
              Güvenlik Kişisi & Bilgiler
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#878792] block mb-1 font-bold">Kişi Adı</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full bg-white border border-[#E5E5EB] rounded-xl px-2.5 py-1.5 text-xs text-[#242428]"
                  placeholder="Örn: Eş / Aile"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#878792] block mb-1 font-bold">Telefon Numarası</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full bg-white border border-[#E5E5EB] rounded-xl px-2.5 py-1.5 text-xs text-[#242428]"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-[#878792] block mb-1 font-bold">Kan Grubu</label>
                <input
                  type="text"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full bg-white border border-[#E5E5EB] rounded-xl px-2.5 py-1.5 text-xs text-[#242428] font-bold"
                  placeholder="0 Rh+"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-[#878792] block mb-1 font-bold">Tıbbi Not</label>
                <input
                  type="text"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full bg-white border border-[#E5E5EB] rounded-xl px-2.5 py-1.5 text-xs text-[#242428]"
                  placeholder="Alerji, kronik durum vb."
                />
              </div>
            </div>

            <button
              onClick={saveContactInfo}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] text-xs font-bold cursor-pointer transition shadow-sm"
            >
              Bilgileri Güncelle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
