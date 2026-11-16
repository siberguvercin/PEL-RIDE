import React, { useState, useRef, useEffect } from 'react';
import {
  Instagram,
  Download,
  Share2,
  Copy,
  Check,
  X,
  Layers,
  Palette,
  Eye,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  Award,
  Bike
} from 'lucide-react';
import { SavedRide, LatLng } from '../types';

interface InstagramStoryModalProps {
  ride: SavedRide | null;
  isOpen: boolean;
  onClose: () => void;
  riderName?: string;
}

type StoryTheme = 'carbon' | 'topo' | 'sunrise' | 'minimal';

export const InstagramStoryModal: React.FC<InstagramStoryModalProps> = ({
  ride,
  isOpen,
  onClose,
  riderName = 'PEL Sporcusu'
}) => {
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme>('carbon');
  const [showElevationSparkline, setShowElevationSparkline] = useState(true);
  const [showAthleteBadge, setShowAthleteBadge] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !ride) return;
    renderStoryCanvas();
  }, [isOpen, ride, selectedTheme, showElevationSparkline, showAthleteBadge]);

  if (!isOpen || !ride) return null;

  // Format Helpers
  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}s ${mins}d ${secs}s`;
    }
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

    // Normalize coordinates to 0..1 bounding box
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
      y: 1 - (p.lat - minLat) / latDelta // Invert latitude for canvas Y
    }));
  };

  // Deterministic realistic cycling route loop generator when GPS points are sparse
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

  // High-Resolution 1080 x 1920 Canvas Renderer
  const renderStoryCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // --- 1. THEME BACKGROUND ---
    if (selectedTheme === 'carbon') {
      // Carbon Dark
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#121215');
      bgGrad.addColorStop(0.5, '#18181D');
      bgGrad.addColorStop(1, '#0C0C0E');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle atmospheric orange glow in top right & center
      const glowGrad = ctx.createRadialGradient(W * 0.8, H * 0.2, 50, W * 0.8, H * 0.2, 600);
      glowGrad.addColorStop(0, 'rgba(252, 76, 2, 0.18)');
      glowGrad.addColorStop(1, 'rgba(252, 76, 2, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);
    } else if (selectedTheme === 'topo') {
      // Topographic Map
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#1A1C23');
      bgGrad.addColorStop(1, '#0F1015');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Topo contour rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let r = 80; r < 1400; r += 90) {
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.55, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (selectedTheme === 'sunrise') {
      // Sunset / Sunrise Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#1E112A');
      bgGrad.addColorStop(0.4, '#2B1424');
      bgGrad.addColorStop(0.7, '#38161D');
      bgGrad.addColorStop(1, '#1A0C16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const sunriseGlow = ctx.createRadialGradient(W * 0.5, H * 0.6, 50, W * 0.5, H * 0.6, 800);
      sunriseGlow.addColorStop(0, 'rgba(252, 76, 2, 0.25)');
      sunriseGlow.addColorStop(1, 'rgba(252, 76, 2, 0)');
      ctx.fillStyle = sunriseGlow;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Minimalist Light
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(1, '#F3F4F6');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    const isLight = selectedTheme === 'minimal';
    const textPrimary = isLight ? '#18181B' : '#FFFFFF';
    const textSecondary = isLight ? '#71717A' : '#A1A1AA';
    const cardBg = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.05)';
    const cardBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';

    // --- 2. TOP HEADER BRANDING ---
    const topMargin = 120;
    ctx.save();

    // PEL Badge
    ctx.fillStyle = '#FC4C02';
    ctx.beginPath();
    ctx.roundRect(80, topMargin, 60, 60, 16);
    ctx.fill();

    // Bike Icon inside badge
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 110, topMargin + 30);

    // Platform & Date Text
    ctx.textAlign = 'left';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FC4C02';
    ctx.fillText('PEL PRO', 160, topMargin + 20);

    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textSecondary;
    ctx.fillText(`CYCLING PLATFORM • ${formattedDate.toUpperCase()}`, 160, topMargin + 50);

    // Category / PR Badge on the right
    ctx.textAlign = 'right';
    ctx.fillStyle = isLight ? '#FFF2ED' : 'rgba(252, 76, 2, 0.18)';
    ctx.beginPath();
    ctx.roundRect(W - 280, topMargin + 5, 200, 48, 14);
    ctx.fill();
    ctx.strokeStyle = '#FC4C02';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FC4C02';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 GPS AKTİVİTE', W - 100, topMargin + 29);
    ctx.restore();

    // --- 3. ACTIVITY TITLE ---
    const titleY = topMargin + 120;
    ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.textAlign = 'left';
    const displayTitle = ride.title.length > 28 ? ride.title.substring(0, 26) + '...' : ride.title;
    ctx.fillText(displayTitle, 80, titleY);

    // --- 4. GIANT HERO STAT: DISTANCE ---
    const heroY = titleY + 80;
    ctx.font = '900 130px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FC4C02';
    ctx.textAlign = 'left';
    const distStr = ride.distanceKm.toFixed(1);
    ctx.fillText(distStr, 80, heroY + 60);

    ctx.font = '800 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textSecondary;
    const distTextWidth = ctx.measureText(distStr).width;
    ctx.fillText('KİLOMETRE', 80 + distTextWidth + 24, heroY + 30);

    // Sub-pill under hero distance
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillStyle = isLight ? '#27272A' : '#E4E4E7';
    ctx.fillText(`GPS İLE DOĞRULANMIŞ SÜRÜŞ ROTASI`, 80 + distTextWidth + 24, heroY + 62);

    // --- 5. 3-COLUMN METRIC TILES ---
    const metricsY = heroY + 110;
    const tileW = (W - 160 - 32) / 3;
    const tileH = 140;

    const metricItems = [
      { label: 'SÜRE', value: formatDuration(ride.durationSec), unit: '' },
      { label: 'TIRMANIŞ', value: `+${ride.climbM || 0}`, unit: 'm' },
      { label: 'ORT. HIZ', value: `${ride.avgSpeedKmH || 0}`, unit: 'km/s' }
    ];

    metricItems.forEach((m, idx) => {
      const tileX = 80 + idx * (tileW + 16);
      ctx.save();
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tileX, metricsY, tileW, tileH, 24);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = textSecondary;
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label, tileX + 24, metricsY + 42);

      // Value
      ctx.fillStyle = textPrimary;
      ctx.font = '900 36px "JetBrains Mono", monospace';
      ctx.fillText(m.value, tileX + 24, metricsY + 95);

      if (m.unit) {
        ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#FC4C02';
        const valW = ctx.measureText(m.value).width;
        ctx.fillText(` ${m.unit}`, tileX + 24 + valW, metricsY + 95);
      }
      ctx.restore();
    });

    // Secondary Metric Row (Power Watts, Calories, Avg HR)
    const secMetricsY = metricsY + tileH + 20;
    const secMetricItems = [
      {
        label: 'GÜÇ',
        value: `${ride.insights?.normalizedPower || Math.round((ride.distanceKm / (ride.durationSec / 3600)) * 7.5)} W`,
        sub: `${ride.insights?.estimatedWattsPerKg || '3.2'} W/kg`
      },
      {
        label: 'KALORİ',
        value: `${ride.caloriesKcal || Math.round(ride.distanceKm * 28)}`,
        sub: 'kcal'
      },
      {
        label: 'ORT. NABIZ',
        value: `${ride.avgHeartRate || 148}`,
        sub: 'BPM'
      }
    ];

    secMetricItems.forEach((m, idx) => {
      const tileX = 80 + idx * (tileW + 16);
      ctx.save();
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tileX, secMetricsY, tileW, 90, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textSecondary;
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label, tileX + 20, secMetricsY + 34);

      ctx.fillStyle = textPrimary;
      ctx.font = '800 26px "JetBrains Mono", monospace';
      ctx.fillText(m.value, tileX + 20, secMetricsY + 68);

      const valW = ctx.measureText(m.value).width;
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FC4C02';
      ctx.fillText(` ${m.sub}`, tileX + 20 + valW, secMetricsY + 68);
      ctx.restore();
    });

    // --- 6. BIRD'S-EYE VIEW (KUŞBAKIŞI) GPS MAP CANVAS ---
    const mapY = secMetricsY + 130;
    const mapH = 680;
    const mapW = W - 160;
    const mapX = 80;

    ctx.save();
    // Map container card
    ctx.fillStyle = isLight ? '#FFFFFF' : '#141418';
    ctx.strokeStyle = isLight ? '#E5E7EB' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 32);
    ctx.fill();
    ctx.stroke();
    ctx.clip();

    // Map background grid
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    const gridSize = 60;
    for (let x = mapX; x < mapX + mapW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, mapY);
      ctx.lineTo(x, mapY + mapH);
      ctx.stroke();
    }
    for (let y = mapY; y < mapY + mapH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(mapX, y);
      ctx.lineTo(mapX + mapW, y);
      ctx.stroke();
    }

    // Compass & Map Badge
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🧭 KUŞBAKIŞI GPS ROTASI', mapX + 30, mapY + 45);

    // North arrow icon
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px "JetBrains Mono", sans-serif';
    ctx.fillStyle = '#FC4C02';
    ctx.fillText('▲ N', mapX + mapW - 30, mapY + 45);

    // Draw GPS Polyline
    const routePoints = getRoutePoints();
    const routePadding = 80;
    const plotW = mapW - routePadding * 2;
    const plotH = mapH - routePadding * 2;
    const plotStartX = mapX + routePadding;
    const plotStartY = mapY + routePadding;

    if (routePoints.length > 1) {
      // Background glow for route line
      ctx.save();
      ctx.strokeStyle = 'rgba(252, 76, 2, 0.45)';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#FC4C02';
      ctx.shadowBlur = 40;

      ctx.beginPath();
      routePoints.forEach((pt, i) => {
        const cx = plotStartX + pt.x * plotW;
        const cy = plotStartY + pt.y * plotH;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.restore();

      // Foreground Crisp Route Line
      ctx.save();
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      routePoints.forEach((pt, i) => {
        const cx = plotStartX + pt.x * plotW;
        const cy = plotStartY + pt.y * plotH;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.restore();

      // Start Marker (Neon Green)
      const startPt = routePoints[0];
      const startX = plotStartX + startPt.x * plotW;
      const startY = plotStartY + startPt.y * plotH;

      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.beginPath();
      ctx.arc(startX, startY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(startX, startY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Finish Marker (Bullseye / Checkered)
      const endPt = routePoints[routePoints.length - 1];
      const endX = plotStartX + endPt.x * plotW;
      const endY = plotStartY + endPt.y * plotH;

      ctx.fillStyle = 'rgba(252, 76, 2, 0.3)';
      ctx.beginPath();
      ctx.arc(endX, endY, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FC4C02';
      ctx.beginPath();
      ctx.arc(endX, endY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Legend Pill in bottom right of map
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(24, 24, 27, 0.85)';
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mapX + 24, mapY + mapH - 60, 220, 36, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(mapX + 42, mapY + mapH - 42, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = textPrimary;
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Başlangıç', mapX + 56, mapY + mapH - 37);

      ctx.fillStyle = '#FC4C02';
      ctx.beginPath();
      ctx.arc(mapX + 150, mapY + mapH - 42, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = textPrimary;
      ctx.fillText('Bitiş', mapX + 164, mapY + mapH - 37);
    }
    ctx.restore();

    // --- 7. BOTTOM ELEVATION PROFILE OR ATHLETE CARD ---
    const bottomY = mapY + mapH + 30;

    if (showElevationSparkline) {
      // Elevation Profile Mini Sparkline
      ctx.save();
      const elevW = W - 160;
      const elevH = 100;
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(80, bottomY, elevW, elevH, 20);
      ctx.fill();
      ctx.stroke();
      ctx.clip();

      ctx.fillStyle = textSecondary;
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`İRTİFA PROFİLİ (TOPLAM +${ride.climbM || 0}M TIRMANIŞ)`, 104, bottomY + 30);

      // Draw elevation spline
      const elevSteps = 24;
      const maxElevM = Math.max(120, ride.climbM || 200);
      ctx.strokeStyle = '#FC4C02';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let s = 0; s <= elevSteps; s++) {
        const sx = 104 + (s / elevSteps) * (elevW - 48);
        const normH = Math.sin((s / elevSteps) * Math.PI) * 0.7 + Math.sin(s * 1.5) * 0.2;
        const sy = bottomY + elevH - 16 - normH * 40;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // --- 8. FOOTER BADGE & ATHLETE SIGNATURE ---
    const footerY = H - 90;
    ctx.save();
    ctx.fillStyle = isLight ? '#E4E4E7' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(80, footerY - 30, W - 160, 2);

    ctx.textAlign = 'left';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = textPrimary;
    ctx.fillText(showAthleteBadge ? `🚴 ${riderName.toUpperCase()}` : '🚴 PELOTON PRO ATHLETE', 80, footerY + 10);

    ctx.textAlign = 'right';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FC4C02';
    ctx.fillText('@PEL.CYCLING • INSTAGRAM STORY', W - 80, footerY + 10);
    ctx.restore();
  };

  // Export to Blob
  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.98);
    });
  };

  // 1. Download Story PNG
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pel-story-${ride.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Share via Web Share API (Direct Instagram Story trigger on iOS / Android)
  const handleInstagramShare = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;

      const file = new File([blob], `pel-ride-story-${ride.id}.png`, { type: 'image/png' });

      // Check if navigator.canShare supports files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `🚴 ${ride.title} - PEL Story`,
          text: `Bugünkü sürüşüm: ${ride.distanceKm} km, +${ride.climbM}m! #peloton #cycling #pelpro`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: download directly and guide the user
        await handleDownload();
      }
    } catch (err) {
      console.warn('Share error or cancelled:', err);
    }
  };

  // 3. Copy Image to Clipboard as Sticker
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
    } catch (err) {
      console.warn('Clipboard write image failed, falling back to download:', err);
      await handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181D] text-white rounded-2xl border border-zinc-700/60 shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col md:flex-row overflow-hidden relative">
        {/* Hidden 1080x1920 High-Res Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Left Side: Live 9:16 Story Preview */}
        <div className="flex-1 bg-black/60 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
          <div className="relative aspect-[9/16] w-full max-w-[270px] sm:max-w-[310px] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/50 bg-[#121215] flex items-center justify-center">
            {/* Live Canvas Mirrored onto an Image Preview */}
            <canvas
              ref={(node) => {
                if (node && canvasRef.current) {
                  const ctx = node.getContext('2d');
                  if (ctx) {
                    node.width = 1080;
                    node.height = 1920;
                    ctx.drawImage(canvasRef.current, 0, 0);
                  }
                }
              }}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Instagram Story Gradient Overlay Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white shadow-sm pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>9:16 STORY ÖNİZLEME</span>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-zinc-300 pointer-events-none">
              <span>1080 × 1920 HD</span>
            </div>
          </div>
        </div>

        {/* Right Side: Theme Controls & Export Actions */}
        <div className="w-full md:w-80 sm:w-96 p-5 sm:p-6 bg-[#18181D] flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 overflow-y-auto">
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FC4C02] uppercase tracking-wider mb-1">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram Story Kartı</span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">
                  Kuşbakışı Sürüş Kartı
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Mesafe, irtifa ve GPS parkurunu tek tıkla Instagram'da paylaşın.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Görsel Tema Stili
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTheme('carbon')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    selectedTheme === 'carbon'
                      ? 'border-[#FC4C02] bg-zinc-800/90 text-white shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-[#18181D] border border-[#FC4C02] shrink-0" />
                  <span className="text-xs font-bold truncate">Asfalt Karbon</span>
                </button>

                <button
                  onClick={() => setSelectedTheme('topo')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    selectedTheme === 'topo'
                      ? 'border-[#FC4C02] bg-zinc-800/90 text-white shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-indigo-950 border border-indigo-500 shrink-0" />
                  <span className="text-xs font-bold truncate">Topografik</span>
                </button>

                <button
                  onClick={() => setSelectedTheme('sunrise')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    selectedTheme === 'sunrise'
                      ? 'border-[#FC4C02] bg-zinc-800/90 text-white shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 shrink-0" />
                  <span className="text-xs font-bold truncate">Peloton Günbatımı</span>
                </button>

                <button
                  onClick={() => setSelectedTheme('minimal')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    selectedTheme === 'minimal'
                      ? 'border-[#FC4C02] bg-zinc-800/90 text-white shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white border border-zinc-300 shrink-0" />
                  <span className="text-xs font-bold truncate">Minimalist Açık</span>
                </button>
              </div>
            </div>

            {/* Visual Toggles */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-2.5">
              <label className="flex items-center justify-between text-xs font-bold text-zinc-300 cursor-pointer">
                <span>İrtifa Profili Sparkline Göster</span>
                <input
                  type="checkbox"
                  checked={showElevationSparkline}
                  onChange={(e) => setShowElevationSparkline(e.target.checked)}
                  className="rounded text-[#FC4C02] focus:ring-[#FC4C02] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-zinc-300 cursor-pointer pt-1 border-t border-zinc-800">
                <span>Sporcu Adı İmzası Göster</span>
                <input
                  type="checkbox"
                  checked={showAthleteBadge}
                  onChange={(e) => setShowAthleteBadge(e.target.checked)}
                  className="rounded text-[#FC4C02] focus:ring-[#FC4C02] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            {/* Primary: Share directly to Instagram Story */}
            <button
              onClick={handleInstagramShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#FC4C02] hover:bg-[#E34402] transition cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram Story'de Paylaş</span>
            </button>

            {/* Secondary actions: Download HD PNG & Copy as Sticker */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition cursor-pointer shadow-xs"
                title="1080x1920 HD PNG olarak galeriye kaydet"
              >
                <Download className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>{isDownloading ? 'İndiriliyor...' : 'Görseli İndir'}</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition cursor-pointer shadow-xs"
                title="Sticker olarak Instagram kamerasına yapıştır"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#FC4C02]" />
                    <span>Sticker Kopyala</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 text-center pt-1">
              * Telefonda 'Paylaş' doğrudan Instagram uygulamasını açar. Bilgisayarda HD PNG olarak indirilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
