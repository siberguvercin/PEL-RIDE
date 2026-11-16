import React, { useState, useEffect } from 'react';
import {
  Compass,
  TrendingUp,
  MapPin,
  Clock,
  Wind,
  CheckCircle2,
  Download,
  Navigation,
  Bike,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Gauge,
  Sliders,
  Layers as SurfaceIcon,
  FolderPlus,
  Star,
  Bookmark,
  Share2
} from 'lucide-react';
import { CyclingRoute, RouteCollection } from '../types';
import { calculateRouteWindScore, calculateDynamicRouteDifficulty } from '../data/cyclingRoutes';
import { routeCollectionService } from '../services/routeCollectionService';
import { RouteShareModal } from './RouteShareModal';

interface RouteDetailModalProps {
  route: CyclingRoute | null;
  currentWindDeg?: number;
  onClose: () => void;
  onLoadOnMap: (route: CyclingRoute) => void;
  onStartRide: (route: CyclingRoute) => void;
  onManageCollections?: (route: CyclingRoute) => void;
}

export const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  currentWindDeg = 45,
  onClose,
  onLoadOnMap,
  onStartRide,
  onManageCollections
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collections, setCollections] = useState<RouteCollection[]>(() =>
    routeCollectionService.getCollections()
  );

  useEffect(() => {
    const unsub = routeCollectionService.subscribe((cols) => {
      setCollections(cols);
    });
    return () => unsub();
  }, []);

  if (!route) return null;

  const assignedCollections = collections.filter((c) => c.routeIds.includes(route.id));
  const isFavorite = routeCollectionService.isFavorite(route.id);

  const handleToggleFavorite = () => {
    routeCollectionService.toggleFavorite(route.id);
  };

  const windMatch = calculateRouteWindScore(route, currentWindDeg);
  const difficulty = route.calculatedDifficulty || calculateDynamicRouteDifficulty(route);

  // Elevation SVG Path Generator
  const elevPoints = route.elevationProfile;
  const minElev = Math.min(...elevPoints.map((p) => p.elevM));
  const maxElev = Math.max(...elevPoints.map((p) => p.elevM));
  const maxDist = route.distanceKm;
  const elevRange = Math.max(1, maxElev - minElev);

  const chartW = 500;
  const chartH = 140;
  const paddingBottom = 25;
  const paddingTop = 15;
  const usableH = chartH - paddingBottom - paddingTop;

  // Build SVG path
  const svgCoords = elevPoints.map((p) => {
    const x = (p.distKm / maxDist) * chartW;
    const y = paddingTop + usableH - ((p.elevM - minElev) / elevRange) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePath = svgCoords.join(' ');
  const areaPath = `0,${chartH - paddingBottom} ${polylinePath} ${chartW},${chartH - paddingBottom}`;

  // GPX File Exporter Generator
  const handleExportGpx = () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PelotonCyclingApp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${route.name}</name>
    <desc>${route.description}</desc>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <type>Cycling</type>
    <trkseg>
${route.waypoints
  .map(
    (wp) =>
      `      <trkpt lat="${wp.lat}" lon="${wp.lng}"><ele>${wp.alt || 100}</ele></trkpt>`
  )
  .join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.slug || 'rota'}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-[#E2E4E9] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E2E4E9] flex items-start justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#FFF2ED] text-[#FC4C02] border border-[#FC4C02]/20">
                {route.category}
              </span>

              {/* Dynamic Difficulty Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${difficulty.badgeBg} ${difficulty.badgeText} ${difficulty.badgeBorder}`}
              >
                ⚡ {difficulty.label} ({difficulty.score}/100)
              </span>

              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                ★ {route.rating.toFixed(1)} ({route.riderCount} sporcu)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#242428] leading-tight">
              {route.name}
            </h2>

            {/* Collection Membership Badges & Quick Action Row */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {/* Quick Favorite Toggle */}
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
                  isFavorite
                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-black'
                    : 'bg-white text-[#6B7280] border-[#E5E5EB] hover:border-amber-400 hover:text-amber-700'
                }`}
                title={isFavorite ? 'Favorilerimden Kaldır' : 'Favorilerime Ekle'}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                <span>{isFavorite ? 'Favorilerimde' : 'Favoriye Ekle'}</span>
              </button>

              {/* Open Collection Selector */}
              {onManageCollections && (
                <button
                  onClick={() => onManageCollections(route)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-[#FFF2ED] hover:bg-[#FFE5DC] text-[#FC4C02] border border-[#FED7C7] transition cursor-pointer shadow-xs"
                  title="Özel kategorilere (Haftalık Hedefler, Zorlu Parkurlar vb.) ekle"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Koleksiyonları Yönet ({assignedCollections.length})</span>
                </button>
              )}

              {/* Quick Share Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] hover:border-[#FC4C02]/40 transition cursor-pointer shadow-xs"
                title="Rotayı Sosyal Medya veya PEL Canlı Sohbetinde Paylaş"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>Paylaş</span>
              </button>

              {/* Badges for other assigned collections */}
              {assignedCollections
                .filter((c) => c.id !== 'col-favorites')
                .map((col) => (
                  <span
                    key={col.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow-xs"
                    style={{
                      backgroundColor: `${col.color}15`,
                      color: col.color,
                      borderColor: `${col.color}35`
                    }}
                  >
                    <span>{col.icon}</span>
                    <span>{col.name}</span>
                  </span>
                ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5F7] hover:bg-[#E2E4E9] text-[#71717A] hover:text-[#18181B] flex items-center justify-center transition cursor-pointer font-bold text-sm shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 flex-1">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E4E9] rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] text-center">
            <div className="p-3">
              <span className="text-[10px] font-bold text-[#71717A] block uppercase tracking-wider">
                MESAFE
              </span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-[#18181B]">
                {route.distanceKm} <small className="text-xs font-normal">km</small>
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-bold text-[#71717A] block uppercase tracking-wider">
                TIRMANIŞ (ELEV)
              </span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-[#FC4C02]">
                +{route.climbM} <small className="text-xs font-normal">m</small>
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-bold text-[#71717A] block uppercase tracking-wider">
                MAKS. EĞİM
              </span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-[#18181B]">
                %{route.maxGradientPct}
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-bold text-[#71717A] block uppercase tracking-wider">
                TAHMİNİ SÜRE
              </span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-[#18181B]">
                ~{route.estimatedTimeMin} <small className="text-xs font-normal">dk</small>
              </span>
            </div>
          </div>

          {/* AUTOMATIC DIFFICULTY CALCULATION ALGORITHM WIDGET */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#242428] flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#FC4C02]" />
                Otomatik Zorluk Algoritması (Eğim, Mesafe, Yüzey)
              </span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${difficulty.badgeBg} ${difficulty.badgeText} ${difficulty.badgeBorder}`}
              >
                {difficulty.label} · %{difficulty.score} Zorluk
              </span>
            </div>

            <p className="text-xs text-[#6D6D78] leading-relaxed">
              {difficulty.summary}
            </p>

            {/* 3 Parameter Breakdown Bars */}
            <div className="space-y-2 pt-1 border-t border-[#E5E5EB]/80">
              {/* 1. Gradient & Climb Workload */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-bold text-[#242428] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#FC4C02]" />
                    Eğim & Tırmanış Yükü
                  </span>
                  <span className="font-mono text-[#878792]">
                    {difficulty.breakdown.gradientImpact}/60 puan (+{route.climbM}m, maks %{route.maxGradientPct})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E5E5EB] overflow-hidden">
                  <div
                    className="h-full bg-[#FC4C02] transition-all"
                    style={{ width: `${(difficulty.breakdown.gradientImpact / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* 2. Distance Endurance Load */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-bold text-[#242428] flex items-center gap-1">
                    <Bike className="w-3 h-3 text-blue-600" />
                    Mesafe & Dayanıklılık Yükü
                  </span>
                  <span className="font-mono text-[#878792]">
                    {difficulty.breakdown.distanceImpact}/30 puan ({route.distanceKm} km)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E5E5EB] overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(difficulty.breakdown.distanceImpact / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* 3. Surface Rolling Resistance Multiplier */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-bold text-[#242428] flex items-center gap-1">
                    <SurfaceIcon className="w-3 h-3 text-amber-600" />
                    Yüzey Sürtünme Çarpanı (Crr)
                  </span>
                  <span className="font-mono text-[#878792]">
                    {difficulty.breakdown.surfaceMultiplier}x ({difficulty.breakdown.surfaceDescription})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E5E5EB] overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{
                      width: `${((difficulty.breakdown.surfaceMultiplier - 1) / 0.5) * 100 || 20}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Gear & Cadence Advice */}
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E4E9] flex items-start gap-2 text-xs text-[#18181B]">
              <Compass className="w-4 h-4 text-[#FC4C02] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] text-[#FC4C02] font-bold uppercase">
                  ÖNERİLEN VİTES & KADANS STRATEJİSİ
                </strong>
                <p className="text-[11px] text-[#52525B] mt-0.5">{difficulty.gearAndCadenceAdvice}</p>
              </div>
            </div>
          </div>

          {/* Wind Compatibility Advisory */}
          <div className="p-3.5 rounded-xl bg-[#FFF8F4] border border-[#FCD5C3] flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white shadow-xs text-[#FC4C02] shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className="text-xs font-extrabold text-[#242428] flex items-center gap-1.5">
                  Bugünün Rüzgar Uyumu
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${windMatch.badgeColor}`}>
                    %{windMatch.score} · {windMatch.label}
                  </span>
                </span>
                <span className="text-[11px] font-mono text-[#878792]">
                  İdeal Yön: {route.recommendedWindDir}
                </span>
              </div>
              <p className="text-xs text-[#494950] leading-relaxed">{windMatch.advice}</p>
            </div>
          </div>

          {/* Interactive Elevation Profile Chart */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#242428] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#FC4C02]" />
                İrtifa & Eğim Profili
              </span>
              <span className="text-xs font-mono text-[#878792]">
                Min: {minElev}m · Maks: {maxElev}m
              </span>
            </div>

            {/* SVG Area Elevation Chart */}
            <div className="w-full bg-[#FAFAFC] rounded-xl p-2 border border-[#E5E5EB]/60">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-28 overflow-visible">
                <defs>
                  <linearGradient id={`grad-${route.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FC4C02" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FC4C02" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line
                  x1="0"
                  y1={paddingTop + usableH * 0.5}
                  x2={chartW}
                  y2={paddingTop + usableH * 0.5}
                  stroke="#E5E5EB"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1={chartH - paddingBottom}
                  x2={chartW}
                  y2={chartH - paddingBottom}
                  stroke="#D1D1D6"
                  strokeWidth="1.5"
                />

                {/* Area under curve */}
                <polygon points={areaPath} fill={`url(#grad-${route.id})`} />

                {/* Polyline line */}
                <polyline
                  fill="none"
                  stroke="#FC4C02"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePath}
                />

                {/* Distance Markers at X Axis */}
                <text x="0" y={chartH - 8} fontSize="10" fill="#878792" textAnchor="start">
                  0 km ({minElev}m)
                </text>
                <text x={chartW / 2} y={chartH - 8} fontSize="10" fill="#878792" textAnchor="middle">
                  {(maxDist / 2).toFixed(1)} km
                </text>
                <text x={chartW} y={chartH - 8} fontSize="10" fill="#878792" textAnchor="end">
                  {maxDist} km ({maxElev}m)
                </text>
              </svg>
            </div>

            {/* Gradient Category Legend */}
            <div className="flex items-center justify-between text-[10px] text-[#878792] px-1 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500" />
                Düz & Hafif (&lt;3%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-sm bg-amber-500" />
                Orta Eğim (3-6%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-sm bg-[#FC4C02]" />
                Sert Rampa (6-9%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-sm bg-rose-600" />
                KOM / HC (&gt;9%)
              </span>
            </div>
          </div>

          {/* Description & Surface Info */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              ROTA DETAYLARI & ZEMİN KALİTESİ
            </h4>
            <p className="text-xs text-[#18181B] leading-relaxed">{route.description}</p>
            <div className="pt-2 border-t border-[#E2E4E9] flex items-center justify-between text-xs">
              <span className="text-[#71717A]">Zemin Türü:</span>
              <strong className="text-[#18181B] font-semibold">{route.surface}</strong>
            </div>
          </div>

          {/* Route Highlights Checklist */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
              ÖNE ÇIKAN PARKUR AVANTAJLARI
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {route.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-white border border-[#E2E4E9] text-xs text-[#18181B] flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {route.tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E4E9] text-[11px] font-semibold text-[#52525B]"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E2E4E9] flex flex-wrap items-center justify-between gap-2 sticky bottom-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportGpx}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EAEAEA] border border-[#E5E5EB] text-xs font-bold text-[#242428] transition cursor-pointer shadow-xs"
              title="Garmin, Wahoo ve GPS Cihazları için GPX İndir"
            >
              <Download className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{downloadSuccess ? 'GPX İndirildi ✓' : 'GPX Dosyası İndir'}</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FFF2ED] border border-[#E5E5EB] hover:border-[#FC4C02]/40 text-xs font-bold text-[#242428] transition cursor-pointer shadow-xs"
              title="Rotayı Paylaş (WhatsApp, Telegram, X, PEL Sohbeti)"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Paylaş</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLoadOnMap(route);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4F4F6] border border-[#FC4C02] text-[#FC4C02] text-xs font-black transition cursor-pointer shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Haritada İncele</span>
            </button>

            <button
              onClick={() => {
                onStartRide(route);
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black transition cursor-pointer shadow-md"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Rotayı Sür</span>
            </button>
          </div>
        </div>
      </div>

      {/* Route Share Drawer / Modal */}
      <RouteShareModal
        route={route}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
