import React, { useState, useRef } from 'react';
import {
  X,
  Radio,
  Mic,
  MicOff,
  AlertTriangle,
  Zap,
  Coffee,
  Wind,
  Wrench,
  Users,
  CheckCircle
} from 'lucide-react';
import { socketService } from '../services/socket';

interface PelotonRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRidersCount?: number;
}

export const PelotonRadioModal: React.FC<PelotonRadioModalProps> = ({
  isOpen,
  onClose,
  activeRidersCount = 12
}) => {
  const [isPushToTalkActive, setIsPushToTalkActive] = useState<boolean>(false);
  const [lastSignalSent, setLastSignalSent] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  if (!isOpen) return null;

  const playTacticalSound = (type: 'hazard' | 'sprint' | 'break' | 'echelon' | 'mechanical') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      if (type === 'hazard') {
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(2400, now + i * 0.18);
          gain.gain.setValueAtTime(0.2, now + i * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.18 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + i * 0.18 + 0.15);
        }
      } else if (type === 'sprint') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(466.16, now);
        osc2.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } else if (type === 'break') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.35);
        });
      } else if (type === 'echelon') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'mechanical') {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, now + i * 0.15);
          gain.gain.setValueAtTime(0.15, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.12);
        }
      }
    } catch (_) {}
  };

  const handleSendHorn = (type: 'hazard' | 'sprint' | 'break' | 'echelon' | 'mechanical', title: string) => {
    playTacticalSound(type);
    socketService.sendPelotonRadioSignal(type, title);
    socketService.sendChatMessage(`📻 [Telsiz]: ${title}`, 'global', undefined, undefined, 'chat');

    setLastSignalSent(title);
    setTimeout(() => setLastSignalSent(null), 3000);
  };

  const sendQuickTacticalMessage = (msg: string) => {
    socketService.sendChatMessage(`📢 [Telsiz]: ${msg}`, 'global');
    setLastSignalSent(msg);
    setTimeout(() => setLastSignalSent(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#E2E4E9] rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2ED] flex items-center justify-center text-[#FC4C02]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#242428] flex items-center gap-2">
                Peloton Telsizi & Sinyaller
              </h2>
              <p className="text-xs text-[#878792] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FC4C02]" />
                {activeRidersCount} Bisikletçi Dinlemede
              </p>
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
          {/* Status toast */}
          {lastSignalSent && (
            <div className="p-3 bg-[#FFF8F5] border border-[#FC4C02]/20 rounded-xl text-xs font-bold text-[#FC4C02] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#FC4C02]" />
              <span>Sinyal İletildi: "{lastSignalSent}"</span>
            </div>
          )}

          {/* TACTICAL HORNS SOUNDBOARD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase text-[#878792] tracking-wider">
                CANLI SİNYALLER & KORNALAR
              </h3>
              <span className="text-[10px] text-[#FC4C02] font-bold">1-Dokunuş Gönder</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Hazard Horn */}
              <button
                onClick={() => handleSendHorn('hazard', '⚠️ ENGEL / ÇUKUR / TEHLİKE UYARISI!')}
                className="p-3.5 rounded-2xl bg-[#F7F7FA] hover:bg-white border border-[#E5E5EB] hover:border-[#FC4C02] text-left transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#242428]">Çukur / Engel Var</div>
                <div className="text-[10px] text-[#878792]">İkili sesli ikaz</div>
              </button>

              {/* Sprint Horn */}
              <button
                onClick={() => handleSendHorn('sprint', '⚡ ATAK! SPRİNT BAŞLADI!')}
                className="p-3.5 rounded-2xl bg-[#F7F7FA] hover:bg-white border border-[#E5E5EB] hover:border-[#FC4C02] text-left transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#242428]">Atak / Sprint</div>
                <div className="text-[10px] text-[#878792]">Yarış temposu sesi</div>
              </button>

              {/* Coffee Break */}
              <button
                onClick={() => handleSendHorn('break', '☕ KAHVE / SU MOLASI NOKTASI!')}
                className="p-3.5 rounded-2xl bg-[#F7F7FA] hover:bg-white border border-[#E5E5EB] hover:border-[#FC4C02] text-left transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Coffee className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#242428]">Kahve / Su Molası</div>
                <div className="text-[10px] text-[#878792]">Mola melodisi</div>
              </button>

              {/* Echelon Wind */}
              <button
                onClick={() => handleSendHorn('echelon', '💨 RÜZGAR BARAJI / EŞELON OLUŞTURUN!')}
                className="p-3.5 rounded-2xl bg-[#F7F7FA] hover:bg-white border border-[#E5E5EB] hover:border-[#FC4C02] text-left transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2">
                  <Wind className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#242428]">Rüzgar Eşelonu</div>
                <div className="text-[10px] text-[#878792]">Çapraz rüzgar düzeni</div>
              </button>

              {/* Mechanical */}
              <button
                onClick={() => handleSendHorn('mechanical', '🔧 LASTİK PATLADI / MEKANİK YARDIM!')}
                className="col-span-2 p-3.5 rounded-2xl bg-[#F7F7FA] hover:bg-white border border-[#E5E5EB] hover:border-[#FC4C02] text-left transition transform active:scale-95 cursor-pointer flex items-center gap-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#242428]">
                    Lastik Patladı / Mekanik Yardım
                  </div>
                  <div className="text-[10px] text-[#878792]">
                    Pelotona durma ve pompa/iç lastik desteği çağrısı iletir
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* PUSH TO TALK */}
          <div className="p-4 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] text-center space-y-3">
            <span className="text-xs font-bold text-[#878792] uppercase tracking-wider block">
              CANLI BAS-KONUŞ
            </span>

            <button
              onMouseDown={() => {
                setIsPushToTalkActive(true);
                playTacticalSound('break');
              }}
              onMouseUp={() => {
                setIsPushToTalkActive(false);
                sendQuickTacticalMessage('🎤 [Sesli Telsiz İletisi]');
              }}
              onTouchStart={() => {
                setIsPushToTalkActive(true);
                playTacticalSound('break');
              }}
              onTouchEnd={() => {
                setIsPushToTalkActive(false);
                sendQuickTacticalMessage('🎤 [Sesli Telsiz İletisi]');
              }}
              className={`w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center gap-1 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                isPushToTalkActive
                  ? 'bg-[#242428] text-white ring-4 ring-[#FC4C02]/30 animate-pulse'
                  : 'bg-[#FC4C02] hover:bg-[#E34402] text-white'
              }`}
            >
              {isPushToTalkActive ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
              <span className="text-[10px] font-black tracking-tight">
                {isPushToTalkActive ? 'KONUŞUN...' : 'BASILI TUT'}
              </span>
            </button>
            <p className="text-[11px] text-[#878792]">
              Butona basılı tutarak konuşun. Bıraktığınızda ileti peloton kanalına aktarılır.
            </p>
          </div>

          {/* QUICK MESSAGES */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#878792] uppercase tracking-wider">
              HIZLI TAKTİK MESAJLARI
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                '💨 Tek sıra olun, dar yola giriyoruz!',
                '⚡ Ön grup tempoyu biraz düşürsün.',
                '☕ Önümüzdeki benzinlikte su molası.',
                '🚴 Arkada kopma var, toparlanalım!'
              ].map((msg) => (
                <button
                  key={msg}
                  onClick={() => sendQuickTacticalMessage(msg)}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#F7F7FA] border border-[#E5E5EB] text-left text-xs font-semibold text-[#242428] transition cursor-pointer shadow-sm"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
