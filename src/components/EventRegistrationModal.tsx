import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Calendar,
  MapPin,
  TrendingUp,
  User,
  Phone,
  Shield,
  FileText,
  QrCode,
  Download,
  Share2,
  AlertCircle,
  Bike
} from 'lucide-react';
import { CyclingEvent } from '../types';
import { socketService } from '../services/socket';

interface EventRegistrationModalProps {
  event: CyclingEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationComplete: (event: CyclingEvent, bibNumber: string) => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegistrationComplete
}) => {
  const user = socketService.getUser();

  // Step state: 'form' | 'success_pass'
  const [step, setStep] = useState<'form' | 'success_pass'>('form');

  // Form Fields
  const [courseType, setCourseType] = useState<'long' | 'short'>('long');
  const [athleteName, setAthleteName] = useState(user.name || '');
  const [tcPassport, setTcPassport] = useState('');
  const [birthYear, setBirthYear] = useState('1995');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [teamName, setTeamName] = useState('Peloton Bisiklet Kulübü');
  const [licenseType, setLicenseType] = useState<'uci' | 'national' | 'individual'>('national');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bloodType, setBloodType] = useState('A Rh+');
  const [shirtSize, setShirtSize] = useState<'S' | 'M' | 'L' | 'XL'>('M');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [acceptedWaiver, setAcceptedWaiver] = useState(true);

  // Generated bib result
  const [bibNumber, setBibNumber] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedWaiver) {
      setNotice('Lütfen yarış taahhütnamesini onaylayınız.');
      return;
    }

    // Generate realistic bib number e.g. #248
    const generatedBib = Math.floor(100 + Math.random() * 899).toString();
    setBibNumber(generatedBib);
    setNotice(null);

    // Save registration pass to localStorage
    const passData = {
      eventId: event.id,
      eventTitle: event.title,
      bibNumber: generatedBib,
      athleteName,
      date: event.date,
      startTime: event.startTime,
      courseType,
      teamName
    };
    localStorage.setItem(`pel_event_pass_${event.id}`, JSON.stringify(passData));

    // Send registration over socket
    socketService.send({
      type: 'register_event',
      eventId: event.id,
      userId: user.id,
    });

    onRegistrationComplete(event, generatedBib);
    setStep('success_pass');
  };

  const handleDownloadTicket = () => {
    setNotice(`"${event.title}" Resmi Yarış Kartı (#${bibNumber}) cihazınıza indirildi.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E4E9] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#FC4C02] flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FC4C02]">
                RESMİ YARIŞ KAYIT PORTALI
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#18181B] leading-tight">
                {step === 'form' ? 'Etkinlik Kayıt Formu' : 'Resmi Yarış Kartı & Kayıt Onayı'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F5F7] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Notice */}
        {notice && (
          <div className="mx-5 mt-3 p-3 rounded-lg bg-[#FFF4EE] border border-[#FCD5C3] text-xs font-semibold text-[#18181B] flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-[#71717A] cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {step === 'form' ? (
            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              {/* Event Brief Card */}
              <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFF2ED] text-[#FC4C02]">
                    {event.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#878792]">
                    📅 {event.date} · {event.startTime}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#242428]">
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#878792]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
                    {event.location}, {event.city}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-bold text-[#242428]">
                    {event.distanceKm} km (+{event.elevationM}m)
                  </span>
                </div>
              </div>

              {/* 1. Course Selection */}
              <div>
                <label className="block text-xs font-bold text-[#878792] uppercase mb-1.5">
                  Parkur Tercihi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCourseType('long')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      courseType === 'long'
                        ? 'bg-[#FFF2ED] border-[#FC4C02] text-[#242428]'
                        : 'bg-white border-[#E5E5EB] text-[#878792] hover:bg-[#F7F7FA]'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-[#242428]">Uzun Parkur (Gran Fondo)</div>
                    <div className="text-[11px] font-mono text-[#FC4C02] font-bold mt-0.5">{event.distanceKm} km · +{event.elevationM}m</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourseType('short')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      courseType === 'short'
                        ? 'bg-[#FFF2ED] border-[#FC4C02] text-[#242428]'
                        : 'bg-white border-[#E5E5EB] text-[#878792] hover:bg-[#F7F7FA]'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-[#242428]">Kısa Parkur (Medio Fondo)</div>
                    <div className="text-[11px] font-mono text-[#FC4C02] font-bold mt-0.5">{Math.round(event.distanceKm * 0.6)} km · +{Math.round(event.elevationM * 0.55)}m</div>
                  </button>
                </div>
              </div>

              {/* 2. Personal Information */}
              <div className="space-y-3 pt-2 border-t border-[#F0F0F4]">
                <h4 className="text-xs font-black uppercase text-[#878792] tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FC4C02]" />
                  Sporcu Kimlik & Lisans Bilgileri
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={athleteName}
                      onChange={(e) => setAthleteName(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      T.C. Kimlik / Pasaport No
                    </label>
                    <input
                      type="text"
                      value={tcPassport}
                      onChange={(e) => setTcPassport(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Doğum Yılı
                    </label>
                    <input
                      type="text"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Cinsiyet
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-bold"
                    >
                      <option value="M">Erkek</option>
                      <option value="F">Kadın</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Forma Bedeni
                    </label>
                    <select
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value as any)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-bold"
                    >
                      <option value="S">S (Small)</option>
                      <option value="M">M (Medium)</option>
                      <option value="L">L (Large)</option>
                      <option value="XL">XL (X-Large)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Kulüp / Takım Adı
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                      placeholder="Örn: Ferdi / Takım Adı"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Lisans Türü & No
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-mono"
                      placeholder="UCI veya Federasyon No"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Emergency & Health */}
              <div className="space-y-3 pt-2 border-t border-[#F0F0F4]">
                <h4 className="text-xs font-black uppercase text-[#878792] tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#FC4C02]" />
                  Güvenlik & Acil Durum İletişimi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Acil Kişi Adı
                    </label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Acil Telefon
                    </label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#878792] mb-1">
                      Kan Grubu
                    </label>
                    <input
                      type="text"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 4. Terms & Waiver Checkbox */}
              <div className="p-3 bg-[#F7F7FA] rounded-2xl border border-[#E5E5EB] flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="waiver-check"
                  checked={acceptedWaiver}
                  onChange={(e) => setAcceptedWaiver(e.target.checked)}
                  className="mt-0.5 accent-[#FC4C02] cursor-pointer w-4 h-4"
                />
                <label htmlFor="waiver-check" className="text-xs text-[#494950] leading-relaxed cursor-pointer select-none">
                  Bisiklet Federasyonu ve organizasyonun kask, güvenlik ve sağlık yönergelerine uyacağımı, parkur kurallarını peşinen kabul ettiğimi beyan ederim.
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] font-bold text-xs transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resmi Kaydı Tamamla & Göğüs No Al</span>
                </button>
              </div>
            </form>
          ) : (
            /* OFFICIAL RACE PASS DISPLAY */
            <div className="space-y-4">
              {/* Race Pass Card */}
              <div className="rounded-2xl border-2 border-[#FC4C02] bg-gradient-to-b from-white to-[#FFF9F5] p-5 shadow-lg relative overflow-hidden">
                {/* Decorative bib header */}
                <div className="flex items-center justify-between border-b border-[#F0E6DE] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FC4C02] text-white flex items-center justify-center font-black text-xs">
                      P
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FC4C02] block">
                        RESMİ SPORCU GİRİŞ KARTI
                      </span>
                      <h4 className="font-extrabold text-sm text-[#242428]">
                        {event.title}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#878792]">
                    {event.date}
                  </span>
                </div>

                {/* Big Bib Number */}
                <div className="text-center py-2 bg-white rounded-2xl border border-[#E5E5EB] shadow-xs my-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#878792] block">
                    GÖĞÜS NUMARANIZ / BIB NUMBER
                  </span>
                  <div className="text-5xl font-black font-mono text-[#FC4C02] tracking-wider my-1">
                    #{bibNumber}
                  </div>
                  <span className="text-[11px] font-bold text-[#242428]">
                    {athleteName} · {teamName}
                  </span>
                </div>

                {/* Race Details Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono my-3">
                  <div className="p-2 bg-[#F7F7FA] rounded-xl border border-[#E5E5EB]">
                    <span className="text-[9px] text-[#878792] block font-sans">PARKUR</span>
                    <strong className="text-[#242428] font-bold">
                      {courseType === 'long' ? 'Gran Fondo' : 'Medio Fondo'}
                    </strong>
                  </div>

                  <div className="p-2 bg-[#F7F7FA] rounded-xl border border-[#E5E5EB]">
                    <span className="text-[9px] text-[#878792] block font-sans">BAŞLANGIÇ</span>
                    <strong className="text-[#242428] font-bold">{event.startTime} (A Koridoru)</strong>
                  </div>

                  <div className="p-2 bg-[#F7F7FA] rounded-xl border border-[#E5E5EB]">
                    <span className="text-[9px] text-[#878792] block font-sans">KAN GRUBU</span>
                    <strong className="text-[#FC4C02] font-bold">{bloodType}</strong>
                  </div>
                </div>

                {/* Simulation Barcode */}
                <div className="pt-3 border-t border-[#F0E6DE] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-8 h-8 text-[#242428]" />
                    <div className="text-left font-mono text-[9px] text-[#878792]">
                      <div>KAYIT KODU: PEL-{event.id.slice(0, 4)}-{bibNumber}</div>
                      <div>ÇİP ZAMANLAMA ENTEGRASYONU AKTİF</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-[#E6F4EA] text-[#137333] px-2.5 py-1 rounded-full uppercase">
                    ONAYLANDI ✓
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTicket}
                  className="flex-1 py-3 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-[#FC4C02]" />
                  <span>Yarış Kartını İndir</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Tamamla & Takvime Ekle</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
