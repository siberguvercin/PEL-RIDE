import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  Clock,
  Heart,
  Flame,
  Award,
  Download,
  X,
  RefreshCw,
  Edit2,
  Check,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  Gauge,
  Activity,
  CheckCircle2,
  Sliders,
  Instagram,
  Share2
} from 'lucide-react';
import { SavedRide, RideInsightsData } from '../types';
import { validateContent, cleanProfanity } from '../utils/profanityFilter';
import { InstagramStoryModal } from './InstagramStoryModal';
import { ShareRideModal } from './ShareRideModal';

interface RideInsightsModalProps {
  ride: SavedRide | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRideNotes?: (rideId: string, updatedTitle: string, notes?: string) => void;
  onExportGpx?: (ride: SavedRide) => void;
  riderFtp?: number;
  riderWeightKg?: number;
}

export const RideInsightsModal: React.FC<RideInsightsModalProps> = ({
  ride,
  isOpen,
  onClose,
  onSaveRideNotes,
  onExportGpx,
  riderFtp = 245,
  riderWeightKg = 70
}) => {
  const [insights, setInsights] = useState<RideInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'power_zones' | 'gear_efficiency'>('overview');

  // Title & Notes Editing with Sportsmanship Profanity Filter
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isInstagramStoryOpen, setIsInstagramStoryOpen] = useState(false);
  const [isShareRideOpen, setIsShareRideOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [titleValidation, setTitleValidation] = useState<{ isValid: boolean; warning?: string }>({
    isValid: true
  });

  useEffect(() => {
    if (!ride || !isOpen) return;

    setCustomTitle(ride.title);
    setUserNotes('');
    setTitleValidation({ isValid: true });

    // Fetch or Generate Ride Insights from server
    fetchInsights(ride);
  }, [ride, isOpen]);

  const fetchInsights = async (currentRide: SavedRide) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/ride-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride: currentRide,
          riderFtp,
          riderWeightKg,
          notes: userNotes
        })
      });

      const data = await res.json();
      if (data && data.insights) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.warn('Ride insights fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !ride) return null;

  const handleTitleChange = (val: string) => {
    const valResult = validateContent(val);
    setCustomTitle(val);
    setTitleValidation({
      isValid: valResult.isValid,
      warning: valResult.warningMessage
    });
  };

  const handleSaveTitleAndNotes = () => {
    const sanitizedTitle = cleanProfanity(customTitle.trim()) || ride.title;
    const sanitizedNotes = cleanProfanity(userNotes.trim());

    if (onSaveRideNotes) {
      onSaveRideNotes(ride.id, sanitizedTitle, sanitizedNotes);
    }
    setCustomTitle(sanitizedTitle);
    setIsEditingTitle(false);
    setTitleValidation({ isValid: true });
  };

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) return `${hrs}sa ${mins}dk`;
    return `${mins}dk ${secs}sn`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative text-[#18181B]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E4E9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#FC4C02] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FC4C02] bg-[#FFF4EE] px-2 py-0.5 rounded border border-[#FCD5C3]">
                  BİYOMEKANİK &amp; PERFORMANS ANALİZİ
                </span>
                <span className="text-[10px] font-mono font-bold text-[#71717A]">
                  FTP: {riderFtp}W
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#18181B] uppercase tracking-tight mt-0.5">
                Aktivite Özeti &amp; Performans
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareRideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FFF4EE] hover:bg-[#FFEBE1] text-[#FC4C02] border border-[#FCD5C3] transition cursor-pointer"
              title="HTML Canvas ile sosyal medya kartı oluştur"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Sürüşü Paylaş</span>
            </button>

            <button
              onClick={() => setIsInstagramStoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#18181B] hover:bg-[#27272A] text-white transition cursor-pointer"
              title="9:16 Instagram Story Kuşbakışı Kartı Oluştur"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Story</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F5F7] rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title & Sportsmanship Moderation Bar */}
        <div className="px-4 py-2.5 bg-[#F8F9FA] border-b border-[#E2E4E9] flex items-center justify-between gap-3">
          {isEditingTitle ? (
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-[#E5E5EB] text-xs font-black text-[#242428] outline-none focus:border-[#FC4C02]"
                  placeholder="Aktivite Başlığı..."
                />
                <button
                  onClick={handleSaveTitleAndNotes}
                  className="px-3 py-1.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-bold transition cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
              {!titleValidation.isValid && (
                <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{titleValidation.warning}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-[#242428]">
                  {customTitle || ride.title}
                </h4>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-[#878792] hover:text-[#FC4C02] transition cursor-pointer"
                  title="Başlığı Düzenle"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[11px] text-[#878792] font-semibold">
                {new Date(ride.date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#F0F0F4] px-4 pt-2 bg-white gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Genel Bakış & Koç</span>
          </button>
          <button
            onClick={() => setActiveTab('power_zones')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'power_zones'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Güç Bölgeleri (7-Zone)</span>
          </button>
          <button
            onClick={() => setActiveTab('gear_efficiency')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gear_efficiency'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Vites & Kadans Verimliliği</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading && !insights ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#FC4C02] animate-spin mx-auto" />
              <h4 className="text-xs font-black uppercase text-[#242428]">
                Sürüş Telemetrisi Analiz Ediliyor...
              </h4>
              <p className="text-xs text-[#878792] max-w-sm mx-auto">
                FTP tavanınız, tırmanış eğimi ve vites oranları biyomekanik modelle hesaplanıyor.
              </p>
            </div>
          ) : (
            <>
              {/* PRIMARY 6 METRICS STRIP */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">MESAFE</span>
                  <span className="text-xs sm:text-sm font-black text-[#242428] font-mono">
                    {ride.distanceKm} km
                  </span>
                </div>
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">SÜRE</span>
                  <span className="text-xs sm:text-sm font-black text-[#242428] font-mono">
                    {formatDuration(ride.durationSec)}
                  </span>
                </div>
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">TIRMANIŞ</span>
                  <span className="text-xs sm:text-sm font-black text-[#FC4C02] font-mono">
                    +{ride.climbM} m
                  </span>
                </div>
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">ORT GÜÇ (NP)</span>
                  <span className="text-xs sm:text-sm font-black text-[#242428] font-mono">
                    {insights?.normalizedPower || 215} W
                  </span>
                </div>
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">W/KG & IF</span>
                  <span className="text-xs sm:text-sm font-black text-[#FC4C02] font-mono">
                    {insights?.estimatedWattsPerKg || (215 / riderWeightKg).toFixed(1)} W/kg
                  </span>
                </div>
                <div className="bg-[#F7F7FA] p-2.5 rounded-xl border border-[#E5E5EB]">
                  <span className="text-[9px] font-bold text-[#878792] uppercase block">TSS YÜKÜ</span>
                  <span className="text-xs sm:text-sm font-black text-[#242428] font-mono">
                    {insights?.trainingStressScore || 85} TSS
                  </span>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & AI COACH NARRATIVE */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Coach Summary Banner */}
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#FC4C02]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B]">
                          BAŞ ANTRENÖR PERFORMANS DEĞERLENDİRMESİ
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-[#FC4C02]">
                        {insights?.trainingStressScore && insights.trainingStressScore > 100
                          ? 'Yoğun Efor'
                          : 'Aerobik Gelişim'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#242428] leading-relaxed font-medium">
                      "{insights?.aiSummary ||
                        `${ride.distanceKm} km mesafeli sürüşte ${insights?.normalizedPower || 215}W normalize güç ürettiniz. Z2 dayanıklılık bölgesi odağıyla enerji verimliliği ve mitokondri gelişimi başarıyla desteklendi.`}"
                    </p>

                    {/* Key Strengths & Improvements Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-[#E5E5EB]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>GÜÇLÜ KAZANIMLAR</span>
                        </span>
                        <ul className="text-[11px] text-[#494950] space-y-1">
                          {(insights?.strengths || [
                            'Hedef FTP yoğunluğu dengeli korundu.',
                            'Z2 ve Z3 aerobik taban gelişimi sağlandı.',
                            'Akıcı kadans ile laktat birikimi geciktirildi.'
                          ]).map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-[#E5E5EB]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FC4C02] block flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#FC4C02]" />
                          <span>GELİŞİM TAVSİYELERİ</span>
                        </span>
                        <ul className="text-[11px] text-[#494950] space-y-1">
                          {(insights?.improvements || [
                            'Yüksek eğimlerde vitesi 1 kademe hafifleterek torku dizlerden rubleye aktarın.',
                            'Toparlanma için yeterli karbonhidrat ve hidrasyon planı uygulayın.'
                          ]).map((imp, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#FC4C02] font-bold">•</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Physiological Recovery & Nutrition Prescriptions */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#878792] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#FC4C02]" />
                      <span>TOPARLANMA VE BESLENME REÇETESİ</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] block">ÖNERİLEN DİNLENME</span>
                        <strong className="text-xs sm:text-sm font-black text-[#242428] font-mono">
                          ~{insights?.recoveryHours || 24} Saat
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] block">KARBONHİDRAT</span>
                        <strong className="text-xs sm:text-sm font-black text-amber-600 font-mono">
                          {insights?.nutritionAdvice.carbsGrams || 140}g
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] block">PROTEİN</span>
                        <strong className="text-xs sm:text-sm font-black text-blue-600 font-mono">
                          {insights?.nutritionAdvice.proteinGrams || 32}g
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] block">SIVI / ELEKTROLİT</span>
                        <strong className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                          {insights?.nutritionAdvice.hydrationLiters || 1.2}L
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COGGAN 7-ZONE POWER BREAKDOWN */}
              {activeTab === 'power_zones' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#242428] uppercase">
                        GÜÇ ÇIKTI BÖLGELERİ (COGGAN 7-ZONE POWER MODEL)
                      </span>
                      <span className="text-[#878792] font-mono font-bold">
                        FTP: {riderFtp} W
                      </span>
                    </div>

                    {/* Stacked Percentage Color Bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200">
                      {insights?.powerZones.map((pz) => (
                        <div
                          key={pz.zone}
                          style={{ width: `${pz.percent}%`, backgroundColor: pz.color }}
                          title={`${pz.name}: %${pz.percent}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 7-Zone Table Cards */}
                  <div className="space-y-1.5">
                    {insights?.powerZones.map((pz) => (
                      <div
                        key={pz.zone}
                        className="p-3 rounded-xl bg-white border border-[#E5E5EB] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-md shrink-0"
                            style={{ backgroundColor: pz.color }}
                          />
                          <div>
                            <span className="font-black text-[#242428] block">{pz.name}</span>
                            <span className="text-[10px] text-[#878792]">{pz.adaptation}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono font-bold text-[#242428] text-xs">
                              {pz.rangeWatts}
                            </span>
                            <span
                              className="font-black px-1.5 py-0.2 rounded text-[10px]"
                              style={{ backgroundColor: `${pz.color}20`, color: pz.color }}
                            >
                              %{pz.percent}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#878792]">
                            {formatDuration(pz.seconds)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GEAR USAGE EFFICIENCY & CADENCE */}
              {activeTab === 'gear_efficiency' && (
                <div className="space-y-4">
                  {/* Efficiency Gauge Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-[#FC4C02]" />
                        <div>
                          <h4 className="text-xs font-black uppercase text-[#242428]">
                            VİTES KULLANIM & KADANS VERİMLİLİĞİ
                          </h4>
                          <span className="text-[10px] text-[#878792]">
                            Pedal çevirme akıcılığı ve dişli oranı analizi
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-[#FC4C02] font-mono">
                          %{insights?.gearEfficiency.score || 88}
                        </span>
                        <span className="text-[9px] text-[#878792] block uppercase font-bold">
                          Verimlilik Skoru
                        </span>
                      </div>
                    </div>

                    {/* Cadence Breakdown 3 Columns */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] uppercase block">
                          DÜŞÜK KADANS (&lt;75 RPM)
                        </span>
                        <span className="text-xs font-black text-rose-600 font-mono">
                          %{insights?.gearEfficiency.grindingPct || 12}
                        </span>
                        <span className="text-[9px] text-[#878792] block">Yüksek Diz Torku</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase block">
                          OPTİMAL (80-95 RPM)
                        </span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          %{insights?.gearEfficiency.optimalPct || 76}
                        </span>
                        <span className="text-[9px] text-emerald-600 block">Aerobik Akıcılık</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#F7F7FA] border border-[#E5E5EB]">
                        <span className="text-[9px] font-bold text-[#878792] uppercase block">
                          YÜKSEK (&gt;100 RPM)
                        </span>
                        <span className="text-xs font-black text-blue-600 font-mono">
                          %{insights?.gearEfficiency.spinningPct || 12}
                        </span>
                        <span className="text-[9px] text-[#878792] block">Boşa Çevirme</span>
                      </div>
                    </div>
                  </div>

                  {/* Gear Recommendation & Chain Cross Alert */}
                  <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#FC4C02]" />
                      <h5 className="text-xs font-black uppercase text-[#242428]">
                        DİŞLİ ORANI & AYNAKOL TAVSİYESİ
                      </h5>
                    </div>
                    <p className="text-xs text-[#242428] font-bold">
                      {insights?.gearEfficiency.recommendedGearing || '50/34T Kompakt Aynakol & 11-30T Ruble'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      {insights?.gearEfficiency.summary}
                    </p>

                    {insights?.gearEfficiency.chainCrossWarning && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Sert eğimlerde zincir çaprazlama (büyük aynakol - büyük ruble) sürtünme kaybı ve aşınmaya yol açabilir.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#F7F7FA] border-t border-[#E5E5EB] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onExportGpx && (
              <button
                onClick={() => onExportGpx(ride)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#EAEAEA] border border-[#E5E5EB] text-xs font-bold text-[#242428] transition cursor-pointer shadow-xs"
                title="Garmin / Wahoo için GPX İndir"
              >
                <Download className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>GPX İndir</span>
              </button>
            )}

            <button
              onClick={() => setIsShareRideOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-md shadow-[#FC4C02]/20 active:scale-95"
              title="HTML Canvas ile sosyal medya özet kartı oluştur ve paylaş"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Sürüşü Paylaş (Canvas)</span>
            </button>

            <button
              onClick={() => setIsInstagramStoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold transition cursor-pointer"
              title="Kuşbakışı GPS haritası ve mesafe ile Instagram Story Paylaş"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Story</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInsights(ride)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E2E4E9] text-xs font-bold text-[#18181B] transition cursor-pointer"
              title="Performans analizini yeniden hesapla"
            >
              <RefreshCw className="w-3 h-3 text-[#FC4C02]" />
              <span className="hidden sm:inline">Yenile</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Aktiviteyi Kaydet & Tamamla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Media Canvas Share Modal */}
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
