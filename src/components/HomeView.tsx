import React from 'react';
import {
  Radio,
  Users,
  Plus,
  ChevronRight,
  MapPin,
  Calendar,
  Zap,
  Shield,
  Wrench,
  Activity,
  Gauge,
  Folder,
  Film,
  ShoppingBag,
  Play
} from 'lucide-react';
import { StreamSession, GroupRide, SavedRide, CyclingEvent, CyclingRoute } from '../types';
import { RankedProgressionCard } from './RankedProgressionCard';
import { WeatherWidget } from './WeatherWidget';
import { MonthlyChallenges } from './MonthlyChallenges';
import { RouteRecommendationsCard } from './RouteRecommendationsCard';

interface HomeViewProps {
  activeStreams: StreamSession[];
  groupRides: GroupRide[];
  savedRides: SavedRide[];
  events: CyclingEvent[];
  ftpWatts: number;
  currentLocation: { lat: number; lng: number } | null;
  onRequestLocation?: () => void;
  onOpenLiveBroadcaster: () => void;
  onStartDirectNormalRide?: () => void;
  onWatchStream: (stream: StreamSession) => void;
  onGoToMap: () => void;
  onGoToRide: () => void;
  onGoToChat: (roomId?: string) => void;
  onGoToEvents: () => void;
  onOpenGroupRideModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenLiveSegments?: () => void;
  onOpenSafetySos?: () => void;
  onOpenAiCoach?: () => void;
  onOpenPelotonRadio?: () => void;
  onOpenMaintenance?: () => void;
  onOpenBluetoothHr?: () => void;
  onSelectRouteOnMap?: (route: CyclingRoute) => void;
  onStartRideWithRoute?: (route: CyclingRoute) => void;
  onInspectRoute?: (route: CyclingRoute) => void;
  onOpenCollections?: () => void;
  onManageRouteCollections?: (route: CyclingRoute) => void;
  onGoToReels?: () => void;
  onGoToMarket?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  activeStreams,
  groupRides,
  savedRides,
  events,
  ftpWatts,
  currentLocation,
  onRequestLocation,
  onOpenLiveBroadcaster,
  onStartDirectNormalRide,
  onWatchStream,
  onGoToMap,
  onGoToRide,
  onGoToChat,
  onGoToEvents,
  onOpenGroupRideModal,
  onOpenLeaderboard,
  onOpenLiveSegments,
  onOpenSafetySos,
  onOpenAiCoach,
  onOpenPelotonRadio,
  onOpenMaintenance,
  onSelectRouteOnMap,
  onStartRideWithRoute,
  onInspectRoute,
  onOpenCollections,
  onManageRouteCollections,
  onGoToReels,
  onGoToMarket
}) => {
  const totalKm = savedRides.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalClimb = savedRides.reduce((acc, r) => acc + r.climbM, 0);

  return (
    <div className="flex flex-col h-full w-full max-w-full min-w-0 bg-[#F4F5F7] text-[#18181B] overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 space-y-5">
        {/* Quick Camera-Free GPS Ride Recorder Banner */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FC4C02]">
              <Activity className="w-3.5 h-3.5" />
              <span>Kamerasız GPS Sürüş Kaydedici</span>
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#18181B]">
              Bugünkü Sürüşünü Kaydet
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] max-w-xl">
              Canlı rota haritası, otomatik duraklatma, tur sayacı ve GPX dışa aktarım ile kamerasız GPS kaydını başlat.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => (onStartDirectNormalRide ? onStartDirectNormalRide() : onGoToRide())}
              className="h-10 px-5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Sürüş Kaydet</span>
            </button>
            <button
              type="button"
              onClick={onGoToMap}
              className="h-10 px-4 rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] text-[#18181B] border border-[#E2E4E9] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-[#FC4C02]" />
              <span>Rota Haritası</span>
            </button>
          </div>
        </div>

        {/* 1. Athlete Progression & Level Summary */}
        <RankedProgressionCard
          stats={{
            totalDistanceKm: totalKm,
            totalClimbM: totalClimb,
            ftpWatts: ftpWatts || 245,
            ridesCount: savedRides.length,
          }}
          onOpenLeaderboard={onOpenLeaderboard}
        />

        {/* 2. Monthly Challenges Component */}
        <MonthlyChallenges
          savedRides={savedRides}
          onStartRide={onGoToRide}
          onOpenLeaderboard={onOpenLeaderboard}
        />

        {/* 3. Cycling Weather & Wind Widget */}
        <WeatherWidget currentLocation={currentLocation} />

        {/* 4. Cycling Route Recommendations & Real Nearby Routes */}
        <RouteRecommendationsCard
          currentLocation={currentLocation}
          currentWindDeg={45}
          onRequestLocation={onRequestLocation}
          onSelectRouteOnMap={(r) => (onSelectRouteOnMap ? onSelectRouteOnMap(r) : onGoToMap())}
          onStartRideWithRoute={(r) => (onStartRideWithRoute ? onStartRideWithRoute(r) : onGoToRide())}
          onInspectRoute={(r) => onInspectRoute && onInspectRoute(r)}
          onGoToAllRoutesMap={onGoToMap}
          onOpenCollections={onOpenCollections}
          onManageRouteCollections={onManageRouteCollections}
        />

        {/* 5. Athlete Tools & Telemetry */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] border border-[#E2E4E9] text-[#FC4C02] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#18181B]">
                  Bisikletçi Araçları &amp; Telemetri
                </h2>
                <p className="text-xs text-[#71717A]">
                  Segmentler, güvenlik bildirimi, sürüş koçu ve ekipman takibi
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={onOpenLiveSegments}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Zap className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Canlı KOM</div>
                <div className="text-[11px] text-[#71717A]">Segment liderlikleri</div>
              </div>
            </button>

            <button
              onClick={onOpenSafetySos}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Shield className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Beacon Güvenlik</div>
                <div className="text-[11px] text-[#71717A]">Canlı takip &amp; kontrol</div>
              </div>
            </button>

            <button
              onClick={onOpenAiCoach}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Gauge className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Sürüş Koçu &amp; PSI</div>
                <div className="text-[11px] text-[#71717A]">Antrenman, rota &amp; basınç</div>
              </div>
            </button>

            <button
              onClick={onOpenPelotonRadio}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Radio className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Peloton Telsizi</div>
                <div className="text-[11px] text-[#71717A]">Grup uyarı düdüğü</div>
              </div>
            </button>

            <button
              onClick={onOpenMaintenance}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Wrench className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Bisiklet Garajı</div>
                <div className="text-[11px] text-[#71717A]">Parça ve zincir ömrü</div>
              </div>
            </button>

            <button
              onClick={() => (onStartDirectNormalRide ? onStartDirectNormalRide() : onGoToRide())}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Play className="w-4 h-4 text-[#FC4C02] fill-current mb-2" />
              <div>
                <div className="text-xs font-bold text-white">Sürüş Kaydet</div>
                <div className="text-[11px] text-zinc-400">Direkt kamerasız GPS</div>
              </div>
            </button>

            <button
              onClick={onOpenCollections}
              className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
            >
              <Folder className="w-4 h-4 text-[#FC4C02] mb-2" />
              <div>
                <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">Koleksiyonlar</div>
                <div className="text-[11px] text-[#71717A]">Favoriler &amp; hedefler</div>
              </div>
            </button>

            {onGoToReels && (
              <button
                onClick={onGoToReels}
                className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
              >
                <Film className="w-4 h-4 text-[#FC4C02] mb-2" />
                <div>
                  <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">PEL Reels</div>
                  <div className="text-[11px] text-[#71717A]">Dikey bisiklet klipleri</div>
                </div>
              </button>
            )}

            {onGoToMarket && (
              <button
                onClick={onGoToMarket}
                className="p-3.5 min-h-[82px] rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] hover:border-[#FC4C02]/50 text-left transition cursor-pointer flex flex-col justify-between group"
              >
                <ShoppingBag className="w-4 h-4 text-[#FC4C02] mb-2" />
                <div>
                  <div className="text-xs font-bold text-[#18181B] group-hover:text-[#FC4C02] transition">2. El Pazar</div>
                  <div className="text-[11px] text-[#71717A]">Bisiklet &amp; parça</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 6. Active Live Broadcasts Banner */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 border-b border-[#ECEEF2] pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#FC4C02] shrink-0" />
              <h2 className="text-sm font-bold text-[#18181B] flex items-center gap-2 flex-wrap">
                <span>Canlı Yayındaki Bisikletçiler</span>
                <span className="text-xs font-mono font-normal text-[#71717A]">
                  · {activeStreams.length} aktif
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => (onStartDirectNormalRide ? onStartDirectNormalRide() : onGoToRide())}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                title="Kamera ve canlı yayın olmadan direkt normal GPS sürüşü başlat"
              >
                <Play className="w-3.5 h-3.5 text-[#FC4C02] fill-current" />
                <span>Normal Sürüş</span>
              </button>
              <button
                onClick={onOpenLiveBroadcaster}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Yayın Aç</span>
              </button>
            </div>
          </div>

          {activeStreams.length === 0 ? (
            <div className="p-5 rounded-lg bg-[#F8F9FA] border border-[#ECEEF2] text-center space-y-2">
              <Radio className="w-6 h-6 text-[#71717A] mx-auto" />
              <h3 className="text-xs sm:text-sm font-semibold text-[#18181B]">
                Şu anda canlı yayında olan bisikletçi yok
              </h3>
              <p className="text-xs text-[#71717A] max-w-md mx-auto">
                Kamera açmadan direkt normal GPS sürüşünüzü başlatabilir veya canlı yayın başlatabilirsiniz.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                <button
                  onClick={() => (onStartDirectNormalRide ? onStartDirectNormalRide() : onGoToRide())}
                  className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white font-semibold text-xs transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#FC4C02] fill-current" />
                  <span>Kamerasız Sürüş Başlat</span>
                </button>
                <button
                  onClick={onOpenLiveBroadcaster}
                  className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-xs transition cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Canlı Yayın Başlat</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeStreams.map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => onWatchStream(stream)}
                  className="group relative bg-[#F8F9FA] hover:bg-white border border-[#E2E4E9] hover:border-[#FC4C02]/50 rounded-xl overflow-hidden cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#FC4C02]">
                          {stream.category}
                        </span>
                        <h4 className="font-bold text-sm text-[#18181B] mt-0.5 group-hover:text-[#FC4C02] transition">
                          {stream.title}
                        </h4>
                        <p className="text-xs text-[#71717A] mt-0.5">
                          {stream.streamerName}
                        </p>
                      </div>

                      <div className="text-xs font-mono font-semibold text-[#FC4C02] shrink-0">
                        {stream.viewers} izleyici
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-[#ECEEF2] mt-3.5 pt-3 border-t border-[#ECEEF2] text-center font-mono">
                      <div className="px-1">
                        <span className="text-[10px] text-[#71717A] block font-sans">Hız</span>
                        <span className="text-xs font-bold text-[#18181B]">
                          {stream.speed.toFixed(1)} km/s
                        </span>
                      </div>
                      <div className="px-1">
                        <span className="text-[10px] text-[#71717A] block font-sans">İrtifa</span>
                        <span className="text-xs font-bold text-[#FC4C02]">
                          {Math.round(stream.altitude)}m
                        </span>
                      </div>
                      <div className="px-1">
                        <span className="text-[10px] text-[#71717A] block font-sans">Mesafe</span>
                        <span className="text-xs font-bold text-[#18181B]">
                          {stream.distance.toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-white border-t border-[#ECEEF2] flex items-center justify-between text-xs text-[#FC4C02] font-semibold">
                    <span>Yayına Katıl &amp; Sohbet Et</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Events Section */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3.5 border-b border-[#ECEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FC4C02]" />
                <span>Bisiklet Yarış &amp; Etkinlik Takvimi</span>
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Gran Fondo, kriteryum ve kulüp etkinlikleri
              </p>
            </div>
            <button
              onClick={onGoToEvents}
              className="h-8 flex items-center gap-1 px-3 rounded-lg bg-[#F8F9FA] hover:bg-[#F0F1F4] text-[#18181B] font-semibold text-xs border border-[#E2E4E9] transition cursor-pointer whitespace-nowrap"
            >
              <span>Tümünü Gör ({events.length})</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#FC4C02]" />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-[#ECEEF2] text-center">
              <span className="text-xs font-medium text-[#71717A]">
                Şu anda aktif etkinlik bulunmuyor
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  onClick={onGoToEvents}
                  className="p-3.5 rounded-xl bg-[#F8F9FA] hover:bg-white border border-[#E2E4E9] hover:border-[#FC4C02]/50 cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-semibold text-[#FC4C02]">
                        {ev.category}
                      </span>
                      <span className="text-[11px] text-[#71717A] font-mono">
                        {ev.date}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#18181B] line-clamp-1">
                      {ev.title}
                    </h4>
                    <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FC4C02]" />
                      <span className="truncate">{ev.location}, {ev.city}</span>
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#ECEEF2] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#18181B] font-semibold">{ev.distanceKm} km · +{ev.elevationM}m</span>
                    <span className="text-[#FC4C02] text-xs font-sans font-semibold">Kayıt Ol</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. Group Rides Section */}
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3.5 border-b border-[#ECEEF2] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FC4C02]" />
                <span>Kulüp &amp; Grup Sürüşleri</span>
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Kulüp arkadaşlarınla ortak rotaya katıl veya yeni sürüş aç
              </p>
            </div>
            <button
              onClick={onOpenGroupRideModal}
              className="h-8 flex items-center gap-1 px-3 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sürüş Planla</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupRides.map((ride) => (
              <div
                key={ride.id}
                className="bg-[#F8F9FA] border border-[#E2E4E9] hover:border-[#FC4C02]/40 rounded-xl p-3.5 flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-mono font-bold text-[#FC4C02]">
                      KOD: {ride.code}
                    </span>
                    <span className="text-[11px] text-[#71717A]">
                      {ride.participants} Katılımcı
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#18181B]">{ride.title}</h4>
                  <p className="text-xs text-[#71717A] mt-0.5 truncate">{ride.meetingPoint}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#ECEEF2] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#71717A]">{ride.distanceKm} km · {ride.date}</span>
                  <button
                    onClick={() => onGoToChat(ride.id)}
                    className="h-7 px-2.5 rounded-lg bg-white text-[#FC4C02] text-xs font-semibold border border-[#E2E4E9] hover:border-[#FC4C02] transition cursor-pointer"
                  >
                    Sohbete Gir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
