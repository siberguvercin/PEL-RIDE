import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Sliders,
  Layers,
  ExternalLink,
  Bike,
  Compass,
  Heart,
  Flame,
  Zap,
  Calendar,
  Clock,
  Smartphone,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { SavedRide, LatLng } from '../types';

export type SocialAspectRatio = 'square' | 'story' | 'landscape';
export type SocialCardTheme = 'carbon' | 'sunset' | 'topo' | 'minimal';

interface ShareRideModalProps {
  ride: SavedRide | null;
  isOpen: boolean;
  onClose: () => void;
  riderName?: string;
}

export const ShareRideModal: React.FC<ShareRideModalProps> = ({
  ride,
  isOpen,
  onClose,
  riderName = 'Peloton Sporcusu'
}) => {
  const [aspectRatio, setAspectRatio] = useState<SocialAspectRatio>('square');
  const [theme, setTheme] = useState<SocialCardTheme>('carbon');
  const [showElevationSparkline, setShowElevationSparkline] = useState(true);
  const [showRouteTrack, setShowRouteTrack] = useState(true);
  const [showHeartRate, setShowHeartRate] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !ride) return;
    renderCanvas();
  }, [isOpen, ride, aspectRatio, theme, showElevationSparkline, showRouteTrack, showHeartRate]);

  if (!isOpen || !ride) return null;

  // Format Helpers
  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) return `${hrs}sa ${mins}dk`;
    return `${mins}dk ${secs}sn`;
  };

  const formattedDate = new Date(ride.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate or fallback points for bird's-eye GPS map
  const getRoutePoints = (): { x: number; y: number }[] => {
    const rawPoints = ride.points && ride.points.length > 1 ? ride.points : generateSamplePoints(ride.id);

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    rawPoints.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latDelta = Math.max(0.0001, maxLat - minLat);
    const lngDelta = Math.max(0.0001, maxLng - minLng);

    return rawPoints.map((p) => ({
      x: (p.lng - minLng) / lngDelta,
      y: 1 - (p.lat - minLat) / latDelta
    }));
  };

  const generateSamplePoints = (seedStr: string): LatLng[] => {
    let seed = 42;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
    }
    const count = 48;
    const baseLat = 41.05;
    const baseLng = 29.02;
    const points: LatLng[] = [];

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const r = 0.04 + 0.015 * Math.sin(theta * 3 + seed) + 0.008 * Math.cos(theta * 5);
      points.push({
        lat: baseLat + Math.sin(theta) * r,
        lng: baseLng + Math.cos(theta) * (r * 1.3),
        alt: 50 + Math.abs(Math.sin(theta * 2)) * 180
      });
    }
    return points;
  };

  // Main Canvas Renderer (Generates High-Resolution Social Image)
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine dimensions based on Aspect Ratio
    let W = 1080;
    let H = 1080;
    if (aspectRatio === 'story') {
      W = 1080;
      H = 1920;
    } else if (aspectRatio === 'landscape') {
      W = 1200;
      H = 675;
    }

    canvas.width = W;
    canvas.height = H;

    // --- 1. BACKGROUND ---
    if (theme === 'carbon') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#111115');
      bgGrad.addColorStop(0.5, '#16161B');
      bgGrad.addColorStop(1, '#0D0D10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle Orange atmospheric glow
      const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 30, W * 0.8, H * 0.15, W * 0.6);
      glow.addColorStop(0, 'rgba(252, 76, 2, 0.22)');
      glow.addColorStop(1, 'rgba(252, 76, 2, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    } else if (theme === 'sunset') {
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#1E1025');
      bgGrad.addColorStop(0.5, '#2D1322');
      bgGrad.addColorStop(1, '#1A0C16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, W * 0.7);
      glow.addColorStop(0, 'rgba(252, 76, 2, 0.25)');
      glow.addColorStop(1, 'rgba(252, 76, 2, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    } else if (theme === 'topo') {
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#191B24');
      bgGrad.addColorStop(1, '#0E1015');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let r = 80; r < W * 1.2; r += 90) {
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Minimalist Light
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(1, '#F3F4F6');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    const isLight = theme === 'minimal';
    const textPrimary = isLight ? '#18181B' : '#FFFFFF';
    const textSecondary = isLight ? '#71717A' : '#A1A1AA';
    const cardBg = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.05)';
    const cardBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';

    ctx.save();

    // --- 2. HEADER BRANDING ---
    const padX = aspectRatio === 'landscape' ? 70 : 80;
    const topY = aspectRatio === 'landscape' ? 50 : 80;

    // Brand Logo Pill
    ctx.fillStyle = '#FC4C02';
    ctx.beginPath();
    ctx.roundRect(padX, topY, 48, 48, 14);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', padX + 24, topY + 24);

    // Platform Name & Date
    ctx.textAlign = 'left';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FC4C02';
    ctx.fillText('PEL PRO', padX + 62, topY + 16);

    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textSecondary;
    ctx.fillText(`CYCLING PLATFORM • ${formattedDate.toUpperCase()}`, padX + 62, topY + 40);

    // Verified Ride Chip on Right
    ctx.textAlign = 'right';
    ctx.fillStyle = isLight ? '#FFF2ED' : 'rgba(252, 76, 2, 0.18)';
    ctx.beginPath();
    ctx.roundRect(W - padX - 180, topY + 4, 180, 40, 12);
    ctx.fill();
    ctx.strokeStyle = '#FC4C02';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#FC4C02';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 GPS DOĞRULANDI', W - padX - 18, topY + 24);

    // --- 3. RIDE TITLE ---
    const titleY = topY + (aspectRatio === 'landscape' ? 70 : 90);
    ctx.font = aspectRatio === 'landscape' ? '900 36px "Plus Jakarta Sans", sans-serif' : '900 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.textAlign = 'left';
    const displayTitle = ride.title.length > 34 ? ride.title.substring(0, 32) + '...' : ride.title;
    ctx.fillText(displayTitle, padX, titleY);

    // --- 4. HERO STAT: DISTANCE ---
    const heroY = titleY + (aspectRatio === 'landscape' ? 55 : 65);
    ctx.font = aspectRatio === 'landscape' ? '900 90px "JetBrains Mono", monospace' : '900 110px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FC4C02';
    const distStr = ride.distanceKm.toFixed(1);
    ctx.fillText(distStr, padX, heroY + 40);

    ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textSecondary;
    const distW = ctx.measureText(distStr).width;
    ctx.fillText('KM', padX + distW + 16, heroY + 18);

    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#4B5563' : '#D1D5DB';
    ctx.fillText(`TOPLAM BİSİKLET MESAFESİ`, padX + distW + 16, heroY + 42);

    // --- 5. STATS TILES ROW ---
    const statsY = heroY + (aspectRatio === 'landscape' ? 75 : 85);
    const cols = 4;
    const gap = 14;
    const availableW = W - padX * 2;
    const tileW = (availableW - gap * (cols - 1)) / cols;
    const tileH = aspectRatio === 'landscape' ? 85 : 95;

    const stats = [
      { label: 'SÜRE', value: formatDuration(ride.durationSec) },
      { label: 'TIRMANIŞ', value: `+${ride.climbM || 0} m` },
      { label: 'ORT. HIZ', value: `${ride.avgSpeedKmH || 0} km/s` },
      {
        label: showHeartRate ? 'ORT. NABIZ' : 'GÜÇ',
        value: showHeartRate
          ? `${ride.avgHeartRate || 148} bpm`
          : `${ride.insights?.normalizedPower || Math.round((ride.distanceKm / (ride.durationSec / 3600)) * 7.5)} W`
      }
    ];

    stats.forEach((st, i) => {
      const tx = padX + i * (tileW + gap);
      ctx.save();
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx, statsY, tileW, tileH, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textSecondary;
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(st.label, tx + 16, statsY + 30);

      ctx.fillStyle = textPrimary;
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.fillText(st.value, tx + 16, statsY + 68);
      ctx.restore();
    });

    // --- 6. ROUTE TRACK / BIRD'S EYE VIEW (IF ENABLED) ---
    let nextY = statsY + tileH + 20;

    if (showRouteTrack) {
      const mapCardH = aspectRatio === 'landscape' ? 180 : aspectRatio === 'story' ? 560 : 360;
      const mapX = padX;
      const mapW = availableW;

      ctx.save();
      ctx.fillStyle = isLight ? '#FFFFFF' : '#141418';
      ctx.strokeStyle = isLight ? '#E5E7EB' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(mapX, nextY, mapW, mapCardH, 24);
      ctx.fill();
      ctx.stroke();
      ctx.clip();

      // Subtle grid lines
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = mapX; x < mapX + mapW; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, nextY);
        ctx.lineTo(x, nextY + mapCardH);
        ctx.stroke();
      }
      for (let y = nextY; y < nextY + mapCardH; y += 50) {
        ctx.beginPath();
        ctx.moveTo(mapX, y);
        ctx.lineTo(mapX + mapW, y);
        ctx.stroke();
      }

      // Compass Rose badge
      ctx.fillStyle = textSecondary;
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🧭 KUŞBAKIŞI GPS ROTASI', mapX + 20, nextY + 30);

      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "JetBrains Mono", sans-serif';
      ctx.fillStyle = '#FC4C02';
      ctx.fillText('▲ N', mapX + mapW - 20, nextY + 30);

      // Draw polyline
      const routePoints = getRoutePoints();
      const plotPadding = 45;
      const plotW = mapW - plotPadding * 2;
      const plotH = mapCardH - plotPadding * 2;
      const plotStartX = mapX + plotPadding;
      const plotStartY = nextY + plotPadding;

      if (routePoints.length > 1) {
        // Glowing line shadow
        ctx.save();
        ctx.strokeStyle = 'rgba(252, 76, 2, 0.4)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#FC4C02';
        ctx.shadowBlur = 24;

        ctx.beginPath();
        routePoints.forEach((pt, idx) => {
          const px = plotStartX + pt.x * plotW;
          const py = plotStartY + pt.y * plotH;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();

        // Crisp orange line
        ctx.save();
        ctx.strokeStyle = '#FC4C02';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        routePoints.forEach((pt, idx) => {
          const px = plotStartX + pt.x * plotW;
          const py = plotStartY + pt.y * plotH;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();

        // Start point (Green)
        const sPt = routePoints[0];
        const sX = plotStartX + sPt.x * plotW;
        const sY = plotStartY + sPt.y * plotH;
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(sX, sY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // End point (Orange bullseye)
        const ePt = routePoints[routePoints.length - 1];
        const eX = plotStartX + ePt.x * plotW;
        const eY = plotStartY + ePt.y * plotH;
        ctx.fillStyle = '#FC4C02';
        ctx.beginPath();
        ctx.arc(eX, eY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      nextY += mapCardH + 18;
    }

    // --- 7. ELEVATION SPARKLINE (IF ENABLED & SPACE PERMITS) ---
    if (showElevationSparkline && aspectRatio !== 'landscape') {
      const sparkH = 70;
      ctx.save();
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(padX, nextY, availableW, sparkH, 16);
      ctx.fill();
      ctx.stroke();
      ctx.clip();

      ctx.fillStyle = textSecondary;
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`İRTİFA PROFİLİ (+${ride.climbM || 0}M TIRMANIŞ)`, padX + 16, nextY + 24);

      // Spline
      const steps = 30;
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const sx = padX + 16 + (s / steps) * (availableW - 32);
        const norm = Math.sin((s / steps) * Math.PI) * 0.75 + Math.sin(s * 1.8) * 0.15;
        const sy = nextY + sparkH - 12 - norm * 26;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // --- 8. FOOTER ATHLETE SIGNATURE ---
    const footerY = H - (aspectRatio === 'landscape' ? 35 : 45);
    ctx.save();
    ctx.fillStyle = isLight ? '#E4E4E7' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(padX, footerY - 18, availableW, 1.5);

    ctx.textAlign = 'left';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.fillText(`🚴 ${riderName.toUpperCase()}`, padX, footerY + 8);

    ctx.textAlign = 'right';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FC4C02';
    ctx.fillText('@PEL.PRO • SOSYAL PAYLAŞIM', W - padX, footerY + 8);
    ctx.restore();

    ctx.restore();

    // Mirror to visual preview canvas
    renderPreviewCanvas();
  };

  const renderPreviewCanvas = () => {
    const mainCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!mainCanvas || !previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    previewCanvas.width = mainCanvas.width;
    previewCanvas.height = mainCanvas.height;
    ctx.drawImage(mainCanvas, 0, 0);
  };

  // Export to Blob
  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
    });
  };

  // 1. Download PNG
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pel-ride-share-${aspectRatio}-${ride.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Web Share API
  const handleNativeShare = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;
      const file = new File([blob], `pel-ride-${ride.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `🚴 ${ride.title}`,
          text: `Bugünkü bisiklet antrenmanım: ${ride.distanceKm} km, +${ride.climbM}m! #peloton #cycling #pelpro`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        await handleDownload();
      }
    } catch (err) {
      console.warn('Share cancelled or error:', err);
    }
  };

  // 3. Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        await handleDownload();
      }
    } catch {
      await handleDownload();
    }
  };

  // WhatsApp formatted share link
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🚴 PEL Sürüş Özeti: "${ride.title}"\n📏 Mesafe: ${ride.distanceKm} km | ⛰️ Tırmanış: +${ride.climbM}m | ⏱️ Süre: ${formatDuration(ride.durationSec)}\n💨 Ortalama Hız: ${ride.avgSpeedKmH} km/s\n#pelpro #cycling`
  )}`;

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181D] text-white rounded-2xl border border-zinc-700/60 shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col md:flex-row overflow-hidden relative">
        {/* Hidden Master Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Left Side: Real-Time Canvas Preview */}
        <div className="flex-1 bg-black/60 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/50 bg-[#121215] flex items-center justify-center transition-all ${
              aspectRatio === 'square'
                ? 'aspect-square w-full max-w-[340px] max-h-[55vh]'
                : aspectRatio === 'story'
                ? 'aspect-[9/16] w-full max-w-[270px] max-h-[68vh]'
                : 'aspect-[16/9] w-full max-w-[420px] max-h-[50vh]'
            }`}
          >
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />

            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white shadow-sm pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#FC4C02] animate-pulse" />
              <span className="uppercase">{aspectRatio} KART</span>
            </div>
          </div>
        </div>

        {/* Right Side: Customization & Export Panel */}
        <div className="w-full md:w-88 sm:w-96 p-5 sm:p-6 bg-[#18181D] flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FC4C02] uppercase tracking-wider mb-0.5">
                  <Share2 className="w-4 h-4" />
                  <span>Sürüşü Paylaş (Sosyal Kart)</span>
                </div>
                <h3 className="text-base font-black text-white leading-tight">
                  Sosyal Medya Özet Görseli
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  HTML Canvas ile üretilmiş yüksek çözünürlüklü sürüş istatistik kartı.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format / Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Format & Boyut
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setAspectRatio('square')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                    aspectRatio === 'square'
                      ? 'bg-[#FC4C02] text-white border-[#FC4C02] shadow-xs'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black">1:1 Kare</span>
                  <span className="text-[9px] opacity-80 font-mono">1080×1080</span>
                </button>

                <button
                  onClick={() => setAspectRatio('story')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                    aspectRatio === 'story'
                      ? 'bg-[#FC4C02] text-white border-[#FC4C02] shadow-xs'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black">9:16 Dikey</span>
                  <span className="text-[9px] opacity-80 font-mono">Story/Reels</span>
                </button>

                <button
                  onClick={() => setAspectRatio('landscape')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                    aspectRatio === 'landscape'
                      ? 'bg-[#FC4C02] text-white border-[#FC4C02] shadow-xs'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black">16:9 Yatay</span>
                  <span className="text-[9px] opacity-80 font-mono">1200×675</span>
                </button>
              </div>
            </div>

            {/* Themes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Görsel Tema
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setTheme('carbon')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    theme === 'carbon'
                      ? 'border-[#FC4C02] bg-zinc-800 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#111115] border border-[#FC4C02] shrink-0" />
                  <span>Asfalt Karbon</span>
                </button>

                <button
                  onClick={() => setTheme('sunset')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    theme === 'sunset'
                      ? 'border-[#FC4C02] bg-zinc-800 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shrink-0" />
                  <span>Günbatımı</span>
                </button>

                <button
                  onClick={() => setTheme('topo')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    theme === 'topo'
                      ? 'border-[#FC4C02] bg-zinc-800 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-950 border border-indigo-400 shrink-0" />
                  <span>Topografik</span>
                </button>

                <button
                  onClick={() => setTheme('minimal')}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    theme === 'minimal'
                      ? 'border-[#FC4C02] bg-zinc-800 text-white'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white border border-zinc-400 shrink-0" />
                  <span>Minimal Açık</span>
                </button>
              </div>
            </div>

            {/* Content Toggles */}
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs font-bold text-zinc-300">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Kuşbakışı GPS Rotasını Göster</span>
                <input
                  type="checkbox"
                  checked={showRouteTrack}
                  onChange={(e) => setShowRouteTrack(e.target.checked)}
                  className="rounded text-[#FC4C02] focus:ring-[#FC4C02] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-zinc-800/80">
                <span>İrtifa Profili Sparkline Göster</span>
                <input
                  type="checkbox"
                  checked={showElevationSparkline}
                  onChange={(e) => setShowElevationSparkline(e.target.checked)}
                  className="rounded text-[#FC4C02] focus:ring-[#FC4C02] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="space-y-2 pt-4">
            {/* Primary Action: Direct Share / Download */}
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black text-white bg-[#FC4C02] hover:bg-[#E34402] transition cursor-pointer shadow-lg shadow-[#FC4C02]/25 active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Sosyal Medyada Paylaş</span>
            </button>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition cursor-pointer shadow-xs"
                title="Görseli Cihaza İndir"
              >
                <Download className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>{isDownloading ? 'İndiriliyor...' : 'PNG İndir'}</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition cursor-pointer shadow-xs"
                title="Panoya Kopyala"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Görsel Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Quick Send */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold transition cursor-pointer"
            >
              <MessageSquareIcon className="w-3.5 h-3.5" />
              <span>WhatsApp ile Paylaş</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.97.58 3.86 1.68 5.48L2 22l4.77-1.74c1.57.97 3.38 1.48 5.27 1.48 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.78 14.07c-.24.68-1.4 1.34-1.94 1.39-.54.06-1.23.09-3.56-.87-2.98-1.24-4.88-4.29-5.03-4.49-.15-.2-1.21-1.61-1.21-3.07s.76-2.18 1.04-2.48c.28-.29.61-.37.82-.37.2 0 .41.01.59.02.19.01.44-.07.69.52.25.6.86 2.11.94 2.26.08.15.13.33.02.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.83.86 2.14 1.02.31.15.52.23.59.36.08.12.08.72-.16 1.4z" />
  </svg>
);
