import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  MessageSquare,
  Send,
  Users,
  Smartphone,
  X,
  Link as LinkIcon,
  CheckCircle2,
  Bike
} from 'lucide-react';
import { CyclingRoute } from '../types';
import { calculateDynamicRouteDifficulty } from '../data/cyclingRoutes';
import { socketService } from '../services/socket';

interface RouteShareModalProps {
  route: CyclingRoute | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInChat?: () => void;
}

export const RouteShareModal: React.FC<RouteShareModalProps> = ({
  route,
  isOpen,
  onClose,
  onOpenInChat
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [pelChatSent, setPelChatSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'qr' | 'brief'>('quick');

  if (!isOpen || !route) return null;

  const difficulty = route.calculatedDifficulty || calculateDynamicRouteDifficulty(route);

  // Generate deep share URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/#route=${route.slug || route.id}`;

  const shareTitle = `🚴 ${route.name} (${route.distanceKm} km, +${route.climbM}m)`;
  const shareText = `PEL Bisiklet Platformu üzerinde "${route.name}" rotasını incele! Mesafe: ${route.distanceKm} km, Tırmanış: +${route.climbM}m, Zorluk: ${difficulty.label}. Birlikte sürelim!`;

  // Copy share URL
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Copy formatted route briefing
  const handleCopyBrief = async () => {
    const briefText = `🚴 PEL ROTA ÖNERİSİ: ${route.name}
━━━━━━━━━━━━━━━━━━
📍 Kategori: ${route.category}
📏 Mesafe: ${route.distanceKm} km
⛰️ İrtifa / Tırmanış: +${route.climbM} m
⚡ Zorluk Seviyesi: ${difficulty.label} (${difficulty.score}/100)
⏱️ Tahmini Süre: ~${route.estimatedTimeMin} dk
🛣️ Zemin Türü: ${route.surface}
★ Değerlendirme: ★ ${route.rating.toFixed(1)} (${route.riderCount} sporcu)
━━━━━━━━━━━━━━━━━━
🔗 Haritada Görüntüle: ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(briefText);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2500);
    } catch {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2500);
    }
  };

  // Share directly to PEL Live Chat
  const handleSendToPelChat = () => {
    const chatMsg = `🚴 Rota Paylaşımı: "${route.name}" (${route.distanceKm} km, +${route.climbM}m, ${difficulty.label} %${difficulty.score}). Parkuru haritada incelemek için rotalara göz atın!`;
    socketService.sendChatMessage(chatMsg, 'global', undefined, undefined, 'chat');
    setPelChatSent(true);
    setTimeout(() => setPelChatSent(false), 3500);
  };

  // Web Share API (native mobile/desktop share sheet: Instagram, Messages, AirDrop, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.warn('Native share cancelled or failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Social URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle} - ${shareText}`)}&url=${encodeURIComponent(shareUrl)}`;

  // QR Code URL (high resolution SVG/PNG via secure public endpoint)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#E2E4E9] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#ECEEF2] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] border border-[#FCD5C3] flex items-center justify-center text-[#FC4C02] shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FC4C02] bg-[#FFF2ED] px-2 py-0.5 rounded-md">
                  Rotayı Paylaş
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficulty.badgeBg} ${difficulty.badgeText} ${difficulty.badgeBorder}`}>
                  {difficulty.label}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#242428] truncate max-w-[280px] sm:max-w-[340px]">
                {route.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F7FA] hover:bg-[#EAEAEA] text-[#878792] hover:text-[#242428] flex items-center justify-center transition cursor-pointer font-bold text-sm shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Route Snapshot Bar */}
        <div className="px-5 py-2.5 bg-[#F7F7FA] border-b border-[#E5E5EB] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#242428]">
            <Bike className="w-3.5 h-3.5 text-[#FC4C02]" />
            <span className="font-bold">{route.distanceKm} km</span>
            <span className="text-[#878792]">|</span>
            <span className="text-[#FC4C02] font-bold">+{route.climbM} m</span>
          </div>
          <span className="text-[#878792] text-[11px] font-sans">
            ~{route.estimatedTimeMin} dk • {route.surface}
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E5E5EB] px-4 bg-white">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Hızlı Paylaşım</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Karekod (QR)</span>
          </button>
          <button
            onClick={() => setActiveTab('brief')}
            className={`py-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'brief'
                ? 'border-[#FC4C02] text-[#FC4C02]'
                : 'border-transparent text-[#878792] hover:text-[#242428]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Grup Özeti</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-4">
          {activeTab === 'quick' && (
            <>
              {/* PEL Community Direct Sharing Section */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#FC4C02]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FC4C02]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#242428]">
                      PEL Topluluğu İle Paylaş
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#FC4C02] bg-white px-2 py-0.5 rounded-full border border-[#FC4C02]/20">
                    Doğrudan
                  </span>
                </div>
                <p className="text-[11px] text-[#494950] leading-relaxed">
                  Rotayı tüm aktif bisikletçilerin görebileceği <strong>Genel Peloton Sohbet Odası</strong>na anında iletin.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSendToPelChat}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${
                      pelChatSent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#FC4C02] hover:bg-[#E34402] text-white'
                    }`}
                  >
                    {pelChatSent ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>PEL Sohbetine Gönderildi! ✓</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>PEL Canlı Sohbetine Gönder</span>
                      </>
                    )}
                  </button>

                  {onOpenInChat && (
                    <button
                      onClick={onOpenInChat}
                      className="px-3 py-2.5 rounded-xl border border-[#E5E5EB] bg-white hover:bg-[#F4F4F6] text-xs font-bold text-[#242428] transition cursor-pointer"
                      title="Sohbet Odasına Git"
                    >
                      <MessageSquare className="w-4 h-4 text-[#878792]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Social Media Channels Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#878792] block">
                  Sosyal Medya & Mesajlaşma Uygulamaları
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* WhatsApp */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-[#F0FDF4] border border-[#E5E5EB] hover:border-[#25D366] transition cursor-pointer shadow-xs group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.97.58 3.86 1.68 5.48L2 22l4.77-1.74c1.57.97 3.38 1.48 5.27 1.48 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.78 14.07c-.24.68-1.4 1.34-1.94 1.39-.54.06-1.23.09-3.56-.87-2.98-1.24-4.88-4.29-5.03-4.49-.15-.2-1.21-1.61-1.21-3.07s.76-2.18 1.04-2.48c.28-.29.61-.37.82-.37.2 0 .41.01.59.02.19.01.44-.07.69.52.25.6.86 2.11.94 2.26.08.15.13.33.02.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.83.86 2.14 1.02.31.15.52.23.59.36.08.12.08.72-.16 1.4z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#242428] group-hover:text-[#16A34A] truncate">
                        WhatsApp
                      </span>
                      <span className="block text-[10px] text-[#878792] truncate">
                        Sohbete Gönder
                      </span>
                    </div>
                  </a>

                  {/* Telegram */}
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-[#F0F9FF] border border-[#E5E5EB] hover:border-[#0088CC] transition cursor-pointer shadow-xs group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0088CC]/10 text-[#0088CC] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.56 2.95-1.28 4.92-2.13 5.92-2.54 2.81-1.17 3.4-1.38 3.78-1.38.08 0 .28.02.4.12.1.08.13.2.14.28-.01.07-.01.22-.03.38z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#242428] group-hover:text-[#0088CC] truncate">
                        Telegram
                      </span>
                      <span className="block text-[10px] text-[#878792] truncate">
                        Kanala İlet
                      </span>
                    </div>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-[#F4F4F6] border border-[#E5E5EB] hover:border-black transition cursor-pointer shadow-xs group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-black/10 text-black flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#242428] group-hover:text-black truncate">
                        X (Twitter)
                      </span>
                      <span className="block text-[10px] text-[#878792] truncate">
                        Tweet Paylaş
                      </span>
                    </div>
                  </a>

                  {/* Native Device Share (AirDrop, Instagram, Messages) */}
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-[#EEF2FF] border border-[#E5E5EB] hover:border-[#6366F1] transition cursor-pointer shadow-xs group text-left sm:col-span-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[#242428] group-hover:text-[#6366F1]">
                        Cihaz Paylaşım Menüsü (AirDrop, Instagram, SMS vb.)
                      </span>
                      <span className="block text-[10px] text-[#878792]">
                        Telefon veya bilgisayarınızın yerel paylaşım penceresini açar
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#878792] group-hover:text-[#6366F1]" />
                  </button>
                </div>
              </div>

              {/* Direct Link Copy Card */}
              <div className="p-3.5 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#878792] block">
                  Doğrudan Rota Bağlantısı
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-[#E5E5EB] rounded-xl px-3 py-2 text-xs font-mono text-[#494950] truncate select-all">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#242428] hover:bg-black text-white'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E2E4E9]">
                <img
                  src={qrCodeUrl}
                  alt={`QR Kod: ${route.name}`}
                  className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl object-contain mx-auto"
                  loading="lazy"
                />
              </div>

              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-extrabold text-[#242428]">
                  Kameranızla Tarayın
                </h4>
                <p className="text-xs text-[#878792]">
                  Yanınızdaki bisiklet arkadaşınız telefon kamerasını bu koda tutarak rotayı anında kendi ekranına aktarabilir.
                </p>
              </div>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[#E5E5EB] bg-white hover:bg-[#F7F7FA] text-[#242428] cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>{copiedLink ? 'Bağlantı Kopyalandı ✓' : 'Bağlantıyı Kopyala'}</span>
              </button>
            </div>
          )}

          {activeTab === 'brief' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#878792]">
                  WhatsApp / Telegram Grup Brifingi
                </span>
                <button
                  onClick={handleCopyBrief}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    copiedBrief
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FC4C02] text-white hover:bg-[#E34402]'
                  }`}
                >
                  {copiedBrief ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Metni Kopyala</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F7FA] border border-[#E5E5EB] text-xs font-mono text-[#242428] leading-relaxed whitespace-pre-wrap select-all">
{`🚴 PEL ROTA ÖNERİSİ: ${route.name}
━━━━━━━━━━━━━━━━━━
📍 Kategori: ${route.category}
📏 Mesafe: ${route.distanceKm} km
⛰️ İrtifa: +${route.climbM} m
⚡ Zorluk: ${difficulty.label} (${difficulty.score}/100)
⏱️ Tahmini Süre: ~${route.estimatedTimeMin} dk
🛣️ Zemin Türü: ${route.surface}
★ Değerlendirme: ★ ${route.rating.toFixed(1)} (${route.riderCount} sporcu)
━━━━━━━━━━━━━━━━━━
🔗 Haritada Aç: ${shareUrl}`}
              </div>
              <p className="text-[11px] text-[#878792]">
                Bu metni kopyalayıp grup sohbetlerinize yapıştırarak sürüş öncesi tüm takım arkadaşlarınızı tek hamlede bilgilendirebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#F7F7FA] border-t border-[#E5E5EB] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#878792]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PEL Link & QR Entegrasyonu</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#EAEAEA] border border-[#E5E5EB] text-[#242428] transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
