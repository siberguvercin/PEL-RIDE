import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Gauge,
  Apple,
  Droplet,
  Play,
  Square,
  Zap,
  Activity,
  Info,
  ChevronRight,
  Send,
  RotateCcw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { SavedRide, LatLng } from '../types';
import { fetchCyclingWeather, WeatherData } from '../services/weatherService';

interface AssistantMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface AiCyclingCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  ftpWatts?: number;
  weightKg?: number;
  userName?: string;
  savedRides?: SavedRide[];
  currentLocation?: LatLng | null;
  currentSpeed?: number;
  currentAltitude?: number;
  currentHeartRate?: number;
}

const QUICK_PROMPTS = [
  'Son 7 günlük sürüşlerimi ve form durumumu analiz et',
  'Mevcut hava ve rüzgara göre kıyafet ve rota stratejisi öner',
  'Bu hafta için FTP artırıcı antrenman planı hazırla',
  'Uzun sürüş için beslenme, jel ve sıvı planı oluştur',
];

export const AiCyclingCoachModal: React.FC<AiCyclingCoachModalProps> = ({
  isOpen,
  onClose,
  ftpWatts = 220,
  weightKg = 72,
  userName = 'Sporcu',
  savedRides = [],
  currentLocation = null,
  currentSpeed = 0,
  currentAltitude = 0,
  currentHeartRate = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'tire' | 'nutrition' | 'cadence' | 'zones'>('assistant');

  // Gemini AI Sürüş Asistanı State
  const [aiMessages, setAiMessages] = useState<AssistantMessage[]>([]);
  const [aiInput, setAiInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [weatherContext, setWeatherContext] = useState<WeatherData | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tire Pressure State
  const [riderWeightKg, setRiderWeightKg] = useState<number>(weightKg);
  const [bikeWeightKg, setBikeWeightKg] = useState<number>(8.5);
  const [bikeType, setBikeType] = useState<'road' | 'gravel' | 'mtb'>('road');
  const [tireWidthMm, setTireWidthMm] = useState<number>(28);
  const [surfaceCondition, setSurfaceCondition] = useState<'dry_smooth' | 'dry_rough' | 'wet' | 'gravel'>('dry_smooth');
  const [casingType, setCasingType] = useState<'tubeless' | 'tubed' | 'tpu'>('tubeless');

  // Nutrition Timer State
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [waterMinutesLeft, setWaterMinutesLeft] = useState<number>(15);
  const [carbMinutesLeft, setCarbMinutesLeft] = useState<number>(45);
  const [waterDrunkCount, setWaterDrunkCount] = useState<number>(0);
  const [gelsConsumedCount, setGelsConsumedCount] = useState<number>(0);
  const [soundEnabled] = useState<boolean>(true);

  // Cadence Metronome State
  const [targetCadenceRpm, setTargetCadenceRpm] = useState<number>(88);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const metronomeTimerRef = useRef<any>(null);

  useEffect(() => {
    setRiderWeightKg(weightKg);
  }, [weightKg]);

  useEffect(() => {
    if (!isOpen || !currentLocation) return;
    let active = true;
    fetchCyclingWeather(currentLocation.lat, currentLocation.lng)
      .then((data) => {
        if (active) setWeatherContext(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, currentLocation?.lat, currentLocation?.lng]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isStreaming]);

  useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, [isOpen]);

  const weeklySummary = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
    let weeklyKm = 0;
    let weeklyCount = 0;
    let totalKm = 0;
    let totalClimbM = 0;

    for (const r of savedRides) {
      totalKm += r.distanceKm || 0;
      totalClimbM += r.climbM || 0;
      const ts = new Date(r.date).getTime();
      if (!Number.isNaN(ts) && ts >= cutoff) {
        weeklyKm += r.distanceKm || 0;
        weeklyCount += 1;
      }
    }

    return {
      weeklyKm: Math.round(weeklyKm * 10) / 10,
      weeklyCount,
      totalKm: Math.round(totalKm * 10) / 10,
      totalClimbM: Math.round(totalClimbM),
    };
  }, [savedRides]);

  const sendPromptToGemini = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isStreaming) return;

    setAiError(null);
    const userMsg: AssistantMessage = {
      id: `ai-u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    const modelMsgId = `ai-m-${Date.now() + 1}`;
    const placeholderModelMsg: AssistantMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now() + 1,
    };

    const historySnapshot = aiMessages.map((m) => ({ role: m.role, text: m.text }));
    setAiMessages((prev) => [...prev, userMsg, placeholderModelMsg]);
    setAiInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/ai/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: historySnapshot,
          riderContext: {
            userName,
            ftpWatts,
            weightKg,
            weeklyKm: weeklySummary.weeklyKm,
            totalKm: weeklySummary.totalKm,
            totalClimbM: weeklySummary.totalClimbM,
            ridesCount: savedRides.length,
            recentRides: savedRides.slice(0, 10).map((r) => ({
              title: r.title,
              date: r.date,
              distanceKm: r.distanceKm,
              durationSec: r.durationSec,
              avgSpeedKmH: r.avgSpeedKmH,
              climbM: r.climbM,
              sportType: r.sportType,
            })),
            weather: weatherContext
              ? {
                  temperature: weatherContext.temperature,
                  apparentTemperature: weatherContext.apparentTemperature,
                  windSpeed: weatherContext.windSpeed,
                  windDirectionLabel: weatherContext.windDirectionLabel,
                  humidity: weatherContext.humidity,
                  condition: weatherContext.condition,
                  rideScore: weatherContext.rideScore,
                }
              : null,
            liveTelemetry:
              currentLocation || currentSpeed > 0 || currentHeartRate > 0
                ? {
                    lat: currentLocation?.lat,
                    lng: currentLocation?.lng,
                    speed: currentSpeed,
                    altitude: currentAltitude,
                    heartRate: currentHeartRate,
                  }
                : null,
          },
        }),
      });

      if (!res.ok) {
        let errorMsg = `Sunucu hatası (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.error) errorMsg = errJson.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      if (!res.body) {
        throw new Error('Akış yanıtı okunamadı.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data:')) continue;
          const jsonStr = cleanLine.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const payload = JSON.parse(jsonStr);
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.text) {
              setAiMessages((prev) =>
                prev.map((m) =>
                  m.id === modelMsgId ? { ...m, text: m.text + payload.text } : m
                )
              );
            }
          } catch (parseErr: any) {
            if (parseErr?.message && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const errText = err?.message || 'Performans koçu yanıt veremedi.';
      setAiError(errText);
      setAiMessages((prev) => prev.filter((m) => m.id !== modelMsgId || m.text.trim().length > 0));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }).catch(() => {});
  };

  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  };

  // Metronome Loop
  useEffect(() => {
    if (!isMetronomePlaying) {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      return;
    }

    const intervalMs = (60 / targetCadenceRpm) * 1000;
    let tickCount = 0;

    metronomeTimerRef.current = setInterval(() => {
      tickCount++;
      if (tickCount % 4 === 1) {
        playTone(1000, 0.08, 'triangle');
      } else {
        playTone(700, 0.05, 'sine');
      }
    }, intervalMs);

    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isMetronomePlaying, targetCadenceRpm]);

  // Nutrition Timers Loop
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setWaterMinutesLeft((prev) => {
        if (prev <= 1) {
          playTone(660, 0.3);
          return 15;
        }
        return prev - 1;
      });

      setCarbMinutesLeft((prev) => {
        if (prev <= 1) {
          playTone(950, 0.3);
          return 45;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const calculateTirePressure = () => {
    const totalWeight = riderWeightKg + bikeWeightKg;
    let basePsi = (totalWeight / 80) * (1800 / tireWidthMm);

    if (bikeType === 'gravel') basePsi *= 0.72;
    if (bikeType === 'mtb') basePsi *= 0.42;

    if (casingType === 'tubeless') basePsi *= 0.92;
    if (casingType === 'tpu') basePsi *= 0.96;

    if (surfaceCondition === 'dry_rough') basePsi *= 0.93;
    if (surfaceCondition === 'wet') basePsi *= 0.88;
    if (surfaceCondition === 'gravel') basePsi *= 0.82;

    const frontPsi = Math.max(18, Math.min(115, Math.round(basePsi * 0.94 * 10) / 10));
    const rearPsi = Math.max(20, Math.min(120, Math.round(basePsi * 1.04 * 10) / 10));

    const frontBar = (frontPsi * 0.0689476).toFixed(2);
    const rearBar = (rearPsi * 0.0689476).toFixed(2);

    return { frontPsi, rearPsi, frontBar, rearBar };
  };

  const pressures = calculateTirePressure();

  const powerZones = [
    { name: 'Z1 Aktif Toparlanma', range: `< ${Math.round(ftpWatts * 0.55)}W`, desc: 'Laktat temizleme, ultra hafif pedal.' },
    { name: 'Z2 Aerobik Dayanıklılık', range: `${Math.round(ftpWatts * 0.55)} - ${Math.round(ftpWatts * 0.75)}W`, desc: 'Temel dayanıklılık ve yağ metabolizması.' },
    { name: 'Z3 Tempo', range: `${Math.round(ftpWatts * 0.76)} - ${Math.round(ftpWatts * 0.90)}W`, desc: 'Sürekli grup ritmi ve aerobik kapasite.' },
    { name: 'Z4 Sweet Spot / Eşik', range: `${Math.round(ftpWatts * 0.91)} - ${Math.round(ftpWatts * 1.05)}W`, desc: 'FTP tırmanış temposu. 20-60 dk sınır.' },
    { name: 'Z5 VO2 Max', range: `${Math.round(ftpWatts * 1.06)} - ${Math.round(ftpWatts * 1.20)}W`, desc: '3-8 dakikalık sert yokuş atakları.' },
    { name: 'Z6 Anaerobik Kapasite', range: `${Math.round(ftpWatts * 1.21)} - ${Math.round(ftpWatts * 1.50)}W`, desc: '30 saniye - 2 dakika yüksek güç patlaması.' },
    { name: 'Z7 Nöromusküler Sprint', range: `> ${Math.round(ftpWatts * 1.50)}W`, desc: 'Maksimum güç ile 5-15 saniyelik bitiş sprinti.' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-2xl w-full h-[88vh] max-h-[760px] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#ECEEF2] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] border border-[#FCD5C3] flex items-center justify-center text-[#FC4C02] shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#18181B] truncate">
                Performans Koçu & Ekipman Rehberi
              </h2>
              <p className="text-[11px] text-[#71717A] font-mono tabular-nums truncate">
                FTP: {ftpWatts}W · {(ftpWatts / Math.max(30, weightKg)).toFixed(2)} W/kg · Son 7 Gün: {weeklySummary.weeklyKm} km
                {weatherContext ? ` · ${weatherContext.temperature}°C (${weatherContext.windSpeed} km/s)` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F5F7] transition cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E2E4E9] bg-[#F4F5F7] px-3 pt-2 gap-1 overflow-x-auto shrink-0">
          {[
            { id: 'assistant', label: 'Performans Koçu', icon: Activity },
            { id: 'tire', label: 'Lastik Basıncı', icon: Gauge },
            { id: 'nutrition', label: 'Beslenme & Su', icon: Apple },
            { id: 'cadence', label: 'Kadans', icon: Play },
            { id: 'zones', label: 'Güç Zonları', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#FC4C02] text-[#FC4C02] bg-white'
                    : 'border-transparent text-[#6B7280] hover:text-[#242428] hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        {activeTab === 'assistant' ? (
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAFC]">
            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {aiMessages.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="bg-white border border-[#E5E5EB] rounded-2xl p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FC4C02]">
                      <Activity className="w-4 h-4" />
                      <span>Kişisel Performans Analizi</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#242428] leading-relaxed">
                      Merhaba <strong className="font-bold">{userName}</strong>. Kayıtlı sürüşlerin ({savedRides.length} kayıt, {weeklySummary.totalKm} km),{' '}
                      <span className="font-mono font-semibold">{ftpWatts}W</span> FTP değerin ve anlık hava/rüzgar verilerin doğrultusunda antrenman, tempo ve beslenme planı oluşturabilirim.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-2">
                      Hızlı Başlangıç Soruları
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_PROMPTS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => sendPromptToGemini(q)}
                          className="p-3 rounded-xl bg-white hover:bg-[#FFF5F0] border border-[#E5E5EB] hover:border-[#FC4C02]/50 text-left text-xs font-semibold text-[#242428] transition cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span>{q}</span>
                          <ChevronRight className="w-4 h-4 text-[#FC4C02] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {aiMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-[10px] font-bold ${isUser ? 'text-[#FC4C02]' : 'text-[#6B7280]'}`}>
                            {isUser ? userName : 'PEL Performans Koçu'}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-[#9CA3AF]">
                            {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? 'bg-[#242428] text-white rounded-br-sm'
                              : 'bg-white border border-[#E5E5EB] text-[#242428] rounded-bl-sm shadow-xs'
                          }`}
                        >
                          {msg.text || (
                            <span className="text-[#6B7280] font-medium">
                              Telemetri ve hava verileri değerlendiriliyor...
                            </span>
                          )}
                          {!isUser && msg.text && (
                            <div className="mt-2.5 pt-2 border-t border-[#F0F0F4] flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6B7280] hover:text-[#FC4C02] cursor-pointer transition"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Kopyalandı</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Kopyala</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </>
              )}

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Yanıt Alınamadı</div>
                    <p className="mt-0.5">{aiError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Composer Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#E5E5EB] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPromptToGemini(aiInput);
                }}
                className="flex items-center gap-2"
              >
                {aiMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      abortControllerRef.current?.abort();
                      setAiMessages([]);
                      setAiError(null);
                      setIsStreaming(false);
                    }}
                    className="p-2.5 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#6B7280] hover:text-[#242428] border border-[#E5E5EB] transition cursor-pointer shrink-0"
                    title="Sohbeti Sıfırla"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isStreaming}
                  placeholder="Rota, tempo, nabız, tırmanış veya antrenman sorusu yazın..."
                  className="flex-1 min-w-0 bg-[#F7F7FA] text-xs sm:text-sm text-[#242428] px-3.5 py-2.5 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isStreaming}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shrink-0 ${
                    aiInput.trim() && !isStreaming
                      ? 'bg-[#FC4C02] hover:bg-[#E34402] text-white cursor-pointer shadow-xs'
                      : 'bg-[#F4F4F6] text-[#9CA3AF] border border-[#E5E5EB] cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isStreaming ? 'Yazıyor...' : 'Sor'}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
            {/* TAB 1: TIRE PRESSURE CALCULATOR */}
            {activeTab === 'tire' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#FFF8F5] border border-[#FC4C02]/20 rounded-2xl flex items-start gap-2.5 text-xs text-[#494950]">
                  <Info className="w-4 h-4 text-[#FC4C02] shrink-0 mt-0.5" />
                  <span>
                    SRAM ve Silca mühendislik standartlarına göre optimize edilmiştir. Doğru basınç viraj tutuşunu artırır ve yuvarlanma direncini düşürür.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F7F7FA] rounded-xl border border-[#E5E5EB]">
                    <div className="flex justify-between text-xs font-bold text-[#878792] mb-1">
                      <span>Sürücü Ağırlığı</span>
                      <span className="text-[#242428] font-mono tabular-nums">{riderWeightKg} kg</span>
                    </div>
                    <input
                      type="range"
                      min={45}
                      max={120}
                      value={riderWeightKg}
                      onChange={(e) => setRiderWeightKg(Number(e.target.value))}
                      className="w-full accent-[#FC4C02] cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-[#F7F7FA] rounded-xl border border-[#E5E5EB]">
                    <div className="flex justify-between text-xs font-bold text-[#878792] mb-1">
                      <span>Bisiklet + Ekipman</span>
                      <span className="text-[#242428] font-mono tabular-nums">{bikeWeightKg} kg</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={25}
                      step={0.5}
                      value={bikeWeightKg}
                      onChange={(e) => setBikeWeightKg(Number(e.target.value))}
                      className="w-full accent-[#FC4C02] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#878792] block mb-1">Bisiklet Türü</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['road', 'gravel', 'mtb'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setBikeType(t);
                            if (t === 'road') setTireWidthMm(28);
                            if (t === 'gravel') setTireWidthMm(40);
                            if (t === 'mtb') setTireWidthMm(54);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                            bikeType === t
                              ? 'bg-[#FC4C02] text-white'
                              : 'bg-[#F7F7FA] text-[#878792] hover:bg-[#EBEBEF]'
                          }`}
                        >
                          {t === 'road' ? 'Yol' : t === 'gravel' ? 'Gravel' : 'MTB'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#878792] block mb-1">Lastik Genişliği</label>
                    <select
                      value={tireWidthMm}
                      onChange={(e) => setTireWidthMm(Number(e.target.value))}
                      className="w-full bg-[#F7F7FA] border border-[#E5E5EB] rounded-lg px-2.5 py-1.5 text-xs text-[#242428]"
                    >
                      <option value={25}>25 mm (Klasik Yol)</option>
                      <option value={28}>28 mm (Modern Aero)</option>
                      <option value={30}>30 mm (Konforlu Yol)</option>
                      <option value={32}>32 mm (All-Road)</option>
                      <option value={38}>38 mm (Hızlı Gravel)</option>
                      <option value={42}>42 mm (Gravel)</option>
                      <option value={54}>54 mm (2.1" Dağ Bisikleti)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#878792] block mb-1">Yol / Zemin Durumu</label>
                    <select
                      value={surfaceCondition}
                      onChange={(e) => setSurfaceCondition(e.target.value as any)}
                      className="w-full bg-[#F7F7FA] border border-[#E5E5EB] rounded-lg px-2.5 py-1.5 text-xs text-[#242428]"
                    >
                      <option value="dry_smooth">Pürüzsüz Asfalt</option>
                      <option value="dry_rough">Pürüzlü / Yamalı Asfalt</option>
                      <option value="wet">Islak / Yağmurlu Yol (-12%)</option>
                      <option value="gravel">Toprak / İnce Çakıl</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#878792] block mb-1">Kurulum Tipi</label>
                    <select
                      value={casingType}
                      onChange={(e) => setCasingType(e.target.value as any)}
                      className="w-full bg-[#F7F7FA] border border-[#E5E5EB] rounded-lg px-2.5 py-1.5 text-xs text-[#242428]"
                    >
                      <option value="tubeless">Tubeless (İç Lastiksiz)</option>
                      <option value="tpu">TPU Ultra Hafif İç Lastik</option>
                      <option value="tubed">Standart Butil İç Lastik</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC4C02]/30 text-center">
                    <div className="text-[10px] font-black tracking-widest uppercase text-[#FC4C02]">
                      ÖN TEKERLEK
                    </div>
                    <div className="text-3xl font-black text-[#242428] my-1 font-mono tabular-nums">
                      {pressures.frontPsi} <span className="text-sm font-sans font-bold text-[#FC4C02]">PSI</span>
                    </div>
                    <div className="text-xs text-[#878792] font-mono tabular-nums">
                      {pressures.frontBar} BAR
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#FC4C02]/30 text-center">
                    <div className="text-[10px] font-black tracking-widest uppercase text-[#FC4C02]">
                      ARKA TEKERLEK
                    </div>
                    <div className="text-3xl font-black text-[#242428] my-1 font-mono tabular-nums">
                      {pressures.rearPsi} <span className="text-sm font-sans font-bold text-[#FC4C02]">PSI</span>
                    </div>
                    <div className="text-xs text-[#878792] font-mono tabular-nums">
                      {pressures.rearBar} BAR
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NUTRITION & HYDRATION */}
            {activeTab === 'nutrition' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-[#F7F7FA] border border-[#E5E5EB] rounded-2xl">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#242428]">Beslenme & Sıvı Zamanlayıcı</h4>
                    <p className="text-xs text-[#878792]">Periyodik su ve karbonhidrat bildirimleri</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                      isTimerRunning
                        ? 'bg-[#242428] text-white'
                        : 'bg-[#FC4C02] hover:bg-[#E34402] text-white shadow-sm'
                    }`}
                  >
                    {isTimerRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isTimerRunning ? 'DURDUR' : 'BAŞLAT'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#242428] flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-cyan-600" />
                      HİDRASYON (SU & ELEKTROLİT)
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-[#FC4C02]">
                      {waterMinutesLeft} dakika kaldı
                    </span>
                  </div>
                  <p className="text-xs text-[#494950]">
                    Her 15-20 dakikada bir 150 ml yudumlayarak dehidrasyonu önleyin.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#878792] font-mono tabular-nums">İçilen: {waterDrunkCount} x 150ml</span>
                    <button
                      type="button"
                      onClick={() => {
                        setWaterDrunkCount((c) => c + 1);
                        setWaterMinutesLeft(15);
                        playTone(520, 0.2);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EB] hover:bg-[#EBEBEF] text-[#242428] text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      + 1 Yudum Kaydet
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#242428] flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-[#FC4C02]" />
                      KARBONHİDRAT & ENERJİ JELİ
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-[#FC4C02]">
                      {carbMinutesLeft} dakika kaldı
                    </span>
                  </div>
                  <p className="text-xs text-[#494950]">
                    Glikojen depoları için saatte 40-60 gr karbonhidrat tavsiye edilir.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#878792] font-mono tabular-nums">Tüketilen: {gelsConsumedCount} jel</span>
                    <button
                      type="button"
                      onClick={() => {
                        setGelsConsumedCount((c) => c + 1);
                        setCarbMinutesLeft(45);
                        playTone(880, 0.2);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EB] hover:bg-[#EBEBEF] text-[#242428] text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      + 1 Jel Tüketildi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CADENCE METRONOME */}
            {activeTab === 'cadence' && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-[#F7F7FA] border border-[#E5E5EB] rounded-2xl">
                  <div className="text-xs font-black uppercase text-[#878792] tracking-wider">
                    HEDEF PEDAL KADANSI
                  </div>
                  <div className="text-6xl font-black text-[#242428] font-mono tabular-nums my-3">
                    {targetCadenceRpm} <span className="text-xl text-[#878792]">RPM</span>
                  </div>
                  <p className="text-xs text-[#494950] max-w-sm mx-auto mb-4">
                    Düz yolda 88-92 RPM bacak kaslarını korurken kalbe yükü dengeler.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetCadenceRpm((r) => Math.max(60, r - 2))}
                      className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EB] text-[#242428] font-black text-lg hover:bg-[#EBEBEF] cursor-pointer shadow-sm"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
                      className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer transition shadow-sm ${
                        isMetronomePlaying
                          ? 'bg-[#242428] text-white'
                          : 'bg-[#FC4C02] hover:bg-[#E34402] text-white'
                      }`}
                    >
                      {isMetronomePlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isMetronomePlaying ? 'METRONOMU DURDUR' : 'RİTİMİ BAŞLAT'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCadenceRpm((r) => Math.min(120, r + 2))}
                      className="w-10 h-10 rounded-xl bg-white border border-[#E5E5EB] text-[#242428] font-black text-lg hover:bg-[#EBEBEF] cursor-pointer shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Tırmanış / Yokuş', rpm: 78 },
                    { label: 'Dayanıklılık (Tempo)', rpm: 88 },
                    { label: 'Sprint', rpm: 104 }
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTargetCadenceRpm(item.rpm)}
                      className="p-3 rounded-xl bg-white hover:bg-[#F7F7FA] border border-[#E5E5EB] text-left transition cursor-pointer shadow-sm"
                    >
                      <div className="text-xs font-bold text-[#242428]">{item.label}</div>
                      <div className="text-base font-black text-[#FC4C02] font-mono tabular-nums">{item.rpm} RPM</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: COGGAN 7 POWER ZONES */}
            {activeTab === 'zones' && (
              <div className="space-y-3">
                <div className="p-3 bg-[#FFF8F5] border border-[#FC4C02]/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#FC4C02]">MEVCUT FTP GÜCÜ</span>
                    <div className="text-xl font-black text-[#242428] font-mono tabular-nums">{ftpWatts} WATT</div>
                  </div>
                  <div className="text-right text-[11px] text-[#878792]">
                    Coggan güç profil tablosu
                  </div>
                </div>

                <div className="space-y-2">
                  {powerZones.map((z) => (
                    <div
                      key={z.name}
                      className="p-3 rounded-xl border border-[#E5E5EB] bg-white hover:bg-[#F7F7FA] flex items-center justify-between shadow-sm transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#242428]">{z.name}</span>
                          <span className="text-xs font-mono tabular-nums font-bold text-[#FC4C02]">
                            {z.range}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#878792] mt-0.5">{z.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#878792]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
