import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import {
  Play,
  Pause,
  Flag,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Heart,
  Bluetooth,
  Compass,
  AlertCircle,
  Wind,
  CloudRain,
  AlertTriangle,
  X,
  Shield,
  Gauge,
  BarChart2,
  Key,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  CheckCircle2,
  Repeat,
  Radio,
  ArrowUpRight,
  Minus
} from 'lucide-react';
import {
  LatLng,
  SavedRide,
  HeartRateSensorState,
  RideSportType,
  RideLap
} from '../types';
import { socketService } from '../services/socket';
import { bluetoothHrService } from '../services/bluetoothHrService';
import { apiKeyService } from '../services/apiKeyService';
import { RideInsightsModal } from './RideInsightsModal';
import { BluetoothHrModal } from './BluetoothHrModal';
import { getCurrentZone, getHeartRateZones, calculateEstimatedCalories } from '../utils/heartRate';

interface RideTrackerViewProps {
  currentLocation: LatLng | null;
  onRideFinished: (ride: SavedRide) => void;
  onStartLiveBroadcast?: () => void;
  autoStartKey?: number;
  onOpenSegments?: () => void;
  onOpenSafetySos?: () => void;
  onOpenAiCoach?: () => void;
  onOpenPelotonRadio?: () => void;
  onOpenGarmin?: () => void;
  onOpenApiManagement?: () => void;
  ftpWatts?: number;
}

interface WeatherAlert {
  id: string;
  type: 'wind' | 'rain' | 'storm' | 'temperature';
  severity: 'warning' | 'danger';
  title: string;
  message: string;
  metric: string;
  timestamp: number;
}

const SPORT_TYPES: { id: RideSportType; label: string; shortLabel: string }[] = [
  { id: 'road', label: 'Yol Bisikleti', shortLabel: 'Yol' },
  { id: 'gravel', label: 'Gravel', shortLabel: 'Gravel' },
  { id: 'mtb', label: 'Dağ (MTB)', shortLabel: 'MTB' },
  { id: 'city', label: 'Şehir / Tur', shortLabel: 'Şehir' },
  { id: 'ebike', label: 'E-Bisiklet', shortLabel: 'E-Bike' },
];

const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 };

function LiveRoutePolyline({
  points,
  autoCenter,
  followPoint
}: {
  points: LatLng[];
  autoCenter: boolean;
  followPoint: LatLng | null;
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (points.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: '#FC4C02',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map
      });
    }
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, points]);

  useEffect(() => {
    if (!map || !autoCenter || !followPoint) return;
    map.panTo({ lat: followPoint.lat, lng: followPoint.lng });
  }, [map, autoCenter, followPoint]);

  return null;
}

function getDefaultTurkishRideTitle(sport: RideSportType): string {
  const hour = new Date().getHours();
  const period =
    hour < 11
      ? 'Sabah'
      : hour < 14
      ? 'Öğle'
      : hour < 18
      ? 'Öğleden Sonra'
      : 'Akşam';
  const sportLabel = SPORT_TYPES.find((s) => s.id === sport)?.label || 'Bisiklet';
  return `${period} ${sportLabel} Sürüşü`;
}

export const RideTrackerView: React.FC<RideTrackerViewProps> = ({
  currentLocation,
  onRideFinished,
  autoStartKey = 0,
  onOpenSegments,
  onOpenSafetySos,
  onOpenAiCoach,
  onOpenPelotonRadio,
  onOpenGarmin,
  onOpenApiManagement,
  ftpWatts = 245
}) => {
  const [rideState, setRideState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [sportType, setSportType] = useState<RideSportType>('road');
  const [autoPauseEnabled, setAutoPauseEnabled] = useState<boolean>(true);
  const [isAutoPaused, setIsAutoPaused] = useState<boolean>(false);
  const [shareLocationLive, setShareLocationLive] = useState<boolean>(false);

  // Telemetry state
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [movingSec, setMovingSec] = useState<number>(0);
  const [climbM, setClimbM] = useState<number>(0);
  const [recordedPoints, setRecordedPoints] = useState<LatLng[]>([]);
  const [laps, setLaps] = useState<RideLap[]>([]);
  const [jumpCount, setJumpCount] = useState<number>(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Map UI state
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [autoCenterMap, setAutoCenterMap] = useState<boolean>(true);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Bluetooth HR & Cockpit drawers
  const [hrState, setHrState] = useState<HeartRateSensorState>(bluetoothHrService.getState());
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isLiveStatsOverlayOpen, setIsLiveStatsOverlayOpen] = useState(false);

  // Classic "Aktiviteyi Kaydet" Finish Review Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSportType, setSaveSportType] = useState<RideSportType>('road');
  const [saveEffort, setSaveEffort] = useState<number>(5);
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);
  const [savedRideBanner, setSavedRideBanner] = useState<string | null>(null);

  // Post-save Performance Summary Modal
  const [finishedRideSummary, setFinishedRideSummary] = useState<SavedRide | null>(null);

  // Weather alerts
  const [activeWeatherAlert, setActiveWeatherAlert] = useState<WeatherAlert | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [lastWeatherCheck, setLastWeatherCheck] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoStartKeyRef = useRef<number>(0);
  const lowSpeedCounterRef = useRef<number>(0);
  const lastLapSnapshotRef = useRef<{ distKm: number; sec: number }>({ distKm: 0, sec: 0 });
  const lastJumpTsRef = useRef<number>(0);
  const shareLiveRef = useRef<boolean>(shareLocationLive);
  const autoPauseRef = useRef<boolean>(autoPauseEnabled);

  useEffect(() => {
    shareLiveRef.current = shareLocationLive;
  }, [shareLocationLive]);

  useEffect(() => {
    autoPauseRef.current = autoPauseEnabled;
    if (!autoPauseEnabled && isAutoPaused) {
      setIsAutoPaused(false);
    }
  }, [autoPauseEnabled, isAutoPaused]);

  // Subscribe to Bluetooth HR updates
  useEffect(() => {
    const unsubscribe = bluetoothHrService.subscribe((s) => {
      setHrState(s);
    });
    return () => unsubscribe();
  }, []);

  // Motion sensor listener for automatic jump / ramp detection while recording
  useEffect(() => {
    if (rideState !== 'recording' || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      return;
    }
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const now = Date.now();
      // Vertical / shock threshold (> 17.5 m/s^2 with 1s cooldown)
      if (mag > 17.5 && now - lastJumpTsRef.current > 1000) {
        lastJumpTsRef.current = now;
        setJumpCount((c) => c + 1);
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [rideState]);

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Optional direct trigger from quick buttons
  useEffect(() => {
    if (autoStartKey > 0 && autoStartKey !== lastAutoStartKeyRef.current) {
      lastAutoStartKeyRef.current = autoStartKey;
      setStatusNotice('Kamerasız GPS Sürüş Kaydedici hazır. Başlatmak için "Sürüşü Başlat" butonuna dokunun.');
      setTimeout(() => setStatusNotice(null), 4000);
    }
  }, [autoStartKey]);

  // Calm Weather Alert monitor
  const checkAdverseWeather = async (lat: number, lng: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.current) {
        const cur = data.current;
        const windSpeed = Math.round(cur.wind_speed_10m || 0);
        const windGusts = Math.round(cur.wind_gusts_10m || windSpeed);
        const precip = cur.precipitation || 0;
        const code = cur.weather_code || 0;

        let alertItem: WeatherAlert | null = null;
        if (code >= 95) {
          alertItem = {
            id: 'alert-storm-' + Math.floor(Date.now() / 300000),
            type: 'storm',
            severity: 'danger',
            title: 'Fırtına Uyarısı',
            message: 'Bölgenizde gök gürültülü sağanak tespit edildi.',
            metric: `Kod: ${code}`,
            timestamp: Date.now()
          };
        } else if (precip > 0.6 || (code >= 51 && code <= 82)) {
          alertItem = {
            id: 'alert-rain-' + Math.floor(Date.now() / 300000),
            type: 'rain',
            severity: 'warning',
            title: 'Islak Zemin & Yağış',
            message: 'Bölgede yağış başladı. Virajlarda dikkatli olun.',
            metric: `${precip.toFixed(1)} mm/sa`,
            timestamp: Date.now()
          };
        } else if (windSpeed >= 28 || windGusts >= 40) {
          alertItem = {
            id: 'alert-wind-' + Math.floor(Date.now() / 300000),
            type: 'wind',
            severity: 'warning',
            title: 'Kuvvetli Rüzgar',
            message: `Rüzgar ${windSpeed} km/sa (hamle ${windGusts} km/sa).`,
            metric: `${windSpeed} km/sa`,
            timestamp: Date.now()
          };
        }

        if (alertItem && !dismissedAlertIds.has(alertItem.id)) {
          setActiveWeatherAlert(alertItem);
        }
      }
    } catch {
      // ignore offline
    }
  };

  useEffect(() => {
    const lat = currentLocation?.lat || DEFAULT_CENTER.lat;
    const lng = currentLocation?.lng || DEFAULT_CENTER.lng;
    const now = Date.now();
    if (now - lastWeatherCheck > 180000) {
      setLastWeatherCheck(now);
      checkAdverseWeather(lat, lng);
    }
  }, [currentLocation, lastWeatherCheck]);

  // Moving / Elapsed timer
  useEffect(() => {
    if (rideState === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
        setMovingSec((prev) => (isAutoPaused ? prev : prev + 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rideState, isAutoPaused]);

  const calculateMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startTrackingGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Bu tarayıcı Geolocation API desteklemiyor.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        const { latitude, longitude, altitude, speed: rawSpeed } = pos.coords;
        const currentSpeedKmH = rawSpeed && rawSpeed > 0 ? rawSpeed * 3.6 : 0;
        setSpeed(currentSpeedKmH);
        setMaxSpeed((prev) => Math.max(prev, currentSpeedKmH));

        if (autoPauseRef.current) {
          if (currentSpeedKmH < 1.5) {
            lowSpeedCounterRef.current += 1;
            if (lowSpeedCounterRef.current >= 4) {
              setIsAutoPaused(true);
            }
          } else {
            lowSpeedCounterRef.current = 0;
            setIsAutoPaused(false);
          }
        } else {
          lowSpeedCounterRef.current = 0;
          setIsAutoPaused(false);
        }

        const pt: LatLng = {
          lat: latitude,
          lng: longitude,
          alt: altitude || 0,
          ts: pos.timestamp,
        };

        setRecordedPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const distDelta = calculateMeters(last.lat, last.lng, pt.lat, pt.lng);
            if (distDelta > 2.5) {
              setDistanceKm((d) => d + distDelta / 1000);
              if (pt.alt && last.alt && pt.alt > last.alt + 1) {
                setClimbM((c) => c + (pt.alt! - last.alt!));
                const now = Date.now();
                if (pt.alt - last.alt > 2.2 && now - lastJumpTsRef.current > 1500) {
                  lastJumpTsRef.current = now;
                  setJumpCount((j) => j + 1);
                }
              }
              return [...prev, pt];
            }
            return prev;
          }
          return [pt];
        });

        if (shareLiveRef.current) {
          socketService.sendRiderLocation({
            lat: latitude,
            lng: longitude,
            speed: currentSpeedKmH,
            heading: pos.coords.heading || 0,
            altitude: altitude || 0,
            heartRate: hrState.currentBpm || undefined
          });
        }
      },
      (err) => {
        setGpsError('GPS sinyali alınamadı: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 12000,
      }
    );
  };

  const handleStartRide = () => {
    setSavedRideBanner(null);
    setGpsError(null);
    setIsAutoPaused(false);
    lowSpeedCounterRef.current = 0;
    lastLapSnapshotRef.current = { distKm: 0, sec: 0 };
    lastJumpTsRef.current = 0;
    setJumpCount(0);
    if (currentLocation) {
      setRecordedPoints([currentLocation]);
    }
    setRideState('recording');
    bluetoothHrService.resetRideSession();
    startTrackingGPS();
  };

  const handlePauseToggle = () => {
    if (rideState === 'recording') {
      setRideState('paused');
      setIsAutoPaused(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    } else if (rideState === 'paused') {
      setRideState('recording');
      startTrackingGPS();
    }
  };

  const handleAddLap = () => {
    const prevDist = lastLapSnapshotRef.current.distKm;
    const prevSec = lastLapSnapshotRef.current.sec;
    const activeSec = movingSec > 0 ? movingSec : elapsedSec;
    const lapDist = Math.max(0, parseFloat((distanceKm - prevDist).toFixed(2)));
    const lapSec = Math.max(1, activeSec - prevSec);
    const lapAvg = lapSec > 0 ? parseFloat((lapDist / (lapSec / 3600)).toFixed(1)) : 0;

    const newLap: RideLap = {
      lapNumber: laps.length + 1,
      distanceKm: lapDist,
      durationSec: lapSec,
      avgSpeedKmH: lapAvg,
      timestamp: Date.now()
    };

    lastLapSnapshotRef.current = { distKm: distanceKm, sec: activeSec };
    setLaps((prev) => [newLap, ...prev]);
    setStatusNotice(`Tur #${newLap.lapNumber} kaydedildi (${lapDist.toFixed(2)} km · ${formatTime(lapSec)})`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleOpenFinishReview = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setRideState('paused');
    setIsAutoPaused(false);
    setSaveTitle(getDefaultTurkishRideTitle(sportType));
    setSaveSportType(sportType);
    setSaveEffort(5);
    setSaveNotes('');
    setConfirmDiscard(false);
    setIsSaveModalOpen(true);
  };

  const buildSavedRideObject = (customTitle?: string): SavedRide => {
    const activeMoving = movingSec > 0 ? movingSec : elapsedSec;
    const avgSpeed = activeMoving > 0 ? distanceKm / (activeMoving / 3600) : 0;
    const avgHeartRate = hrState.avgBpm > 0 ? hrState.avgBpm : (hrState.currentBpm || undefined);
    const maxHeartRate = hrState.maxBpm > 0 ? hrState.maxBpm : (hrState.currentBpm || undefined);
    const hrDistribution = bluetoothHrService.getZoneDistribution();
    const calories = calculateEstimatedCalories(activeMoving, avgHeartRate || 138);

    return {
      id: 'ride-' + Date.now(),
      title: (customTitle || saveTitle).trim() || getDefaultTurkishRideTitle(saveSportType),
      date: new Date().toISOString(),
      sportType: saveSportType,
      effort: saveEffort,
      notes: saveNotes.trim() || undefined,
      movingTimeSec: activeMoving,
      laps: [...laps].reverse(),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationSec: elapsedSec,
      avgSpeedKmH: parseFloat(avgSpeed.toFixed(1)),
      maxSpeedKmH: parseFloat(maxSpeed.toFixed(1)),
      climbM: Math.round(climbM),
      descentM: Math.round(climbM * 0.9),
      jumpCount,
      avgHeartRate,
      maxHeartRate,
      caloriesKcal: calories,
      hrZones: hrDistribution,
      points: recordedPoints,
    };
  };

  const resetRecorder = () => {
    setRideState('idle');
    setIsAutoPaused(false);
    setDistanceKm(0);
    setElapsedSec(0);
    setMovingSec(0);
    setSpeed(0);
    setMaxSpeed(0);
    setClimbM(0);
    setJumpCount(0);
    setRecordedPoints([]);
    setLaps([]);
    setConfirmDiscard(false);
    setIsSaveModalOpen(false);
  };

  const handleConfirmSaveRide = () => {
    const saved = buildSavedRideObject();
    onRideFinished(saved);
    setFinishedRideSummary(saved);
    setSavedRideBanner(`"${saved.title}" profil aktivite geçmişinize kaydedildi!`);
    resetRecorder();
    setTimeout(() => setSavedRideBanner(null), 5000);
  };

  const handleExportCurrentGpx = (rideToExport?: SavedRide) => {
    const ride = rideToExport || buildSavedRideObject();
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PEL GPS Recorder">
  <trk>
    <name>${ride.title}</name>
    <type>${ride.sportType || 'cycling'}</type>
    <trkseg>
      ${ride.points
        .map(
          (p) =>
            `<trkpt lat="${p.lat}" lon="${p.lng}"><ele>${p.alt || 0}</ele><time>${
              p.ts ? new Date(p.ts).toISOString() : new Date().toISOString()
            }</time></trkpt>`
        )
        .join('\n      ')}
    </trkseg>
  </trk>
</gpx>`;
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ride.title.replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDiscardRide = () => {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    resetRecorder();
    setStatusNotice('Sürüş kaydı silindi.');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const activeMovingSec = movingSec > 0 ? movingSec : elapsedSec;
  const avgSpeedKmH = activeMovingSec > 0 ? distanceKm / (activeMovingSec / 3600) : 0;
  const estimatedWatts = Math.round(speed > 1 ? speed * 6.2 + (climbM > 0 ? 15 : 0) : 0);

  const riderPoint =
    recordedPoints.length > 0
      ? recordedPoints[recordedPoints.length - 1]
      : currentLocation || DEFAULT_CENTER;

  const currentZone = getCurrentZone(hrState.currentBpm, hrState.maxHeartRateSetting);
  const liveAero = apiKeyService.calculateAeroWindEffect(18, 45, 60, speed > 2 ? speed : 28);
  const liveGradient = apiKeyService.estimateSegmentGradient(
    Math.max(0, climbM - 4),
    climbM,
    Math.max(100, Math.round((distanceKm * 1000) % 1500))
  );

  return (
    <div className="flex flex-col h-full w-full max-w-full min-w-0 bg-[#F4F5F7] text-[#18181B] overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 space-y-5">
        {/* Saved / Status Notifications */}
        {savedRideBanner && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{savedRideBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSavedRideBanner(null)}
              className="p-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {statusNotice && (
          <div className="p-3.5 rounded-xl bg-[#FFF4EE] border border-[#FCD5C3] text-[#18181B] text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#FC4C02] shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="p-1 text-[#71717A] hover:text-[#18181B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeWeatherAlert && (
          <div className="rounded-xl p-4 border bg-white border-[#E2E4E9] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#FFF4EE] text-[#FC4C02]">
                {activeWeatherAlert.type === 'wind' ? (
                  <Wind className="w-4 h-4" />
                ) : activeWeatherAlert.type === 'rain' ? (
                  <CloudRain className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#18181B]">{activeWeatherAlert.title}</span>
                  <span className="text-[11px] font-mono text-[#71717A]">({activeWeatherAlert.metric})</span>
                </div>
                <p className="text-xs text-[#52525B] mt-0.5">{activeWeatherAlert.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDismissedAlertIds((prev) => new Set([...prev, activeWeatherAlert.id]));
                setActiveWeatherAlert(null);
              }}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#18181B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {gpsError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Top Header Card: Sport Selector + GPS Status + Auto-Pause */}
        <div className="bg-white rounded-xl border border-[#E2E4E9] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    rideState === 'recording'
                      ? isAutoPaused
                        ? 'bg-amber-500'
                        : 'bg-[#FC4C02] animate-pulse'
                      : rideState === 'paused'
                      ? 'bg-amber-500'
                      : currentLocation
                      ? 'bg-emerald-500'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]">
                  {rideState === 'recording'
                    ? isAutoPaused
                      ? 'OTOMATİK DURAKLATILDI (HAREKET BEKLENİYOR)'
                      : 'KAMERASIZ GPS KAYDI AKTİF'
                    : rideState === 'paused'
                    ? 'DURAKLATILDI'
                    : currentLocation
                    ? 'GPS SİNYALİ HAZIR • KAMERASIZ'
                    : 'GPS SİNYALİ BEKLENİYOR'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#18181B] mt-1">
                Sürüş Kaydet
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Auto-Pause toggle */}
              <button
                type="button"
                onClick={() => setAutoPauseEnabled((v) => !v)}
                className={`min-h-[40px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  autoPauseEnabled
                    ? 'bg-[#FFF4EE] border-[#FCD5C3] text-[#FC4C02]'
                    : 'bg-[#F4F5F7] border-[#E2E4E9] text-[#71717A]'
                }`}
                title="Durduğunuzda süreyi otomatik duraklatır"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Oto-Duraklat: {autoPauseEnabled ? 'Açık' : 'Kapalı'}</span>
              </button>

              {/* Optional Live Location Sharing */}
              <button
                type="button"
                onClick={() => setShareLocationLive((v) => !v)}
                className={`min-h-[40px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  shareLocationLive
                    ? 'bg-[#18181B] border-[#18181B] text-white'
                    : 'bg-[#F4F5F7] border-[#E2E4E9] text-[#71717A]'
                }`}
                title="Kamerasız harita konum paylaşımı"
              >
                <Radio className={`w-3.5 h-3.5 ${shareLocationLive ? 'text-[#FC4C02]' : ''}`} />
                <span>Haritada Paylaş: {shareLocationLive ? 'Açık' : 'Gizli'}</span>
              </button>

              {/* Bluetooth HR */}
              <button
                type="button"
                onClick={() => setIsBluetoothModalOpen(true)}
                className={`min-h-[40px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  hrState.isConnected
                    ? 'bg-[#FFF4EE] border-[#FCD5C3] text-[#FC4C02]'
                    : 'bg-[#F4F5F7] border-[#E2E4E9] text-[#18181B] hover:border-[#FC4C02]/40'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    hrState.isConnected ? 'text-[#FC4C02] fill-current animate-pulse' : 'text-[#71717A]'
                  }`}
                />
                <span>{hrState.isConnected ? `${hrState.currentBpm} BPM` : 'Nabız Bandı'}</span>
              </button>
            </div>
          </div>

          {/* Sport Type Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {SPORT_TYPES.map((s) => {
              const active = sportType === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSportType(s.id)}
                  className={`min-h-[38px] px-4 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    active
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-[#F8F9FA] text-[#52525B] border-[#E2E4E9] hover:text-[#18181B]'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live GPS Map Canvas with Trail Polyline */}
        <div className="bg-white rounded-xl border border-[#E2E4E9] overflow-hidden relative">
          <div className={`w-full transition-all duration-300 ${isMapExpanded ? 'h-[400px] sm:h-[460px]' : 'h-60 sm:h-72'}`}>
            <Map
              defaultCenter={riderPoint}
              defaultZoom={15}
              mapId="pel_ride_recorder_map"
              mapTypeId={mapTypeId}
              gestureHandling="greedy"
              disableDefaultUI={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
              <LiveRoutePolyline
                points={recordedPoints}
                autoCenter={autoCenterMap}
                followPoint={riderPoint}
              />

              {/* Start Pin */}
              {recordedPoints.length > 0 && (
                <AdvancedMarker position={recordedPoints[0]}>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
                </AdvancedMarker>
              )}

              {/* Current Rider Dot */}
              <AdvancedMarker position={riderPoint}>
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-[#FC4C02]/20 absolute" />
                  <div className="w-4 h-4 rounded-full bg-[#FC4C02] border-2 border-white shadow-lg relative z-10" />
                </div>
              </AdvancedMarker>
            </Map>
          </div>

          {/* Map Controls */}
          <div className="p-3 bg-white border-t border-[#E2E4E9] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-[#71717A] font-mono">
              <Compass className="w-4 h-4 text-[#FC4C02]" />
              <span>
                {recordedPoints.length > 0
                  ? `${recordedPoints.length} GPS noktası kaydedildi`
                  : currentLocation
                  ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : 'Varsayılan konum haritası'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoCenterMap((v) => !v)}
                className={`min-h-[36px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  autoCenterMap
                    ? 'bg-[#FFF4EE] border-[#FCD5C3] text-[#FC4C02]'
                    : 'bg-[#F4F5F7] border-[#E2E4E9] text-[#71717A]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Odakla</span>
              </button>

              <button
                type="button"
                onClick={() => setMapTypeId((m) => (m === 'roadmap' ? 'hybrid' : 'roadmap'))}
                className="min-h-[36px] px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-1.5 cursor-pointer transition"
              >
                <Layers className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>{mapTypeId === 'roadmap' ? 'Uydu' : 'Harita'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMapExpanded((v) => !v)}
                className="min-h-[36px] min-w-[36px] px-2.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center justify-center cursor-pointer transition"
                title={isMapExpanded ? 'Haritayı Küçült' : 'Haritayı Büyüt'}
              >
                {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Classic Strava Telemetry Dashboard */}
        <div className="bg-white rounded-xl border border-[#E2E4E9] p-5 sm:p-6 space-y-5">
          {/* Primary 3 Big Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
            <div className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                <Clock className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>SÜRE</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#18181B] mt-2">
                {formatTime(activeMovingSec)}
              </div>
              <span className="text-[11px] text-[#71717A] block mt-1">
                {autoPauseEnabled ? 'Hareket süresi' : 'Toplam süre'}
              </span>
            </div>

            <div className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                <Activity className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>MESAFE</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#FC4C02] mt-2">
                {distanceKm.toFixed(2)}
              </div>
              <span className="text-[11px] text-[#71717A] block mt-1">kilometre</span>
            </div>

            <div className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">
                <TrendingUp className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>ANLIK HIZ</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#18181B] mt-2">
                {speed.toFixed(1)}
              </div>
              <span className="text-[11px] text-[#71717A] block mt-1">km/saat</span>
            </div>
          </div>

          {/* Secondary 5 Telemetry Strip including Atlama (Jumps / Ramps) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
            <div className="p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">ORT. HIZ</span>
              <strong className="text-lg font-bold font-mono tabular-nums text-[#18181B] mt-0.5 block">
                {avgSpeedKmH.toFixed(1)} <small className="text-[10px] font-sans text-[#71717A]">km/sa</small>
              </strong>
            </div>

            <div className="p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">TIRMANIŞ</span>
              <strong className="text-lg font-bold font-mono tabular-nums text-[#18181B] mt-0.5 block">
                +{Math.round(climbM)} <small className="text-[10px] font-sans text-[#71717A]">m</small>
              </strong>
            </div>

            <div className="p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">EN YÜKSEK</span>
              <strong className="text-lg font-bold font-mono tabular-nums text-[#18181B] mt-0.5 block">
                {maxSpeed.toFixed(1)} <small className="text-[10px] font-sans text-[#71717A]">km/sa</small>
              </strong>
            </div>

            <div className="p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">
                {hrState.isConnected ? 'NABIZ' : 'TAHMİNİ GÜÇ'}
              </span>
              <strong className="text-lg font-bold font-mono tabular-nums text-[#FC4C02] mt-0.5 block">
                {hrState.isConnected ? `${hrState.currentBpm} bpm` : `${estimatedWatts} W`}
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase text-[#71717A] block">ATLAMA / RAMPA</span>
              <div className="flex items-center gap-2 mt-0.5">
                <strong className="text-lg font-bold font-mono tabular-nums text-[#FC4C02]">
                  {jumpCount}
                </strong>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setJumpCount((c) => Math.max(0, c - 1))}
                    className="w-6 h-6 rounded bg-white border border-[#E2E4E9] hover:bg-[#EAECEF] text-[#52525B] flex items-center justify-center cursor-pointer"
                    title="Atlama Azalt"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setJumpCount((c) => c + 1)}
                    className="w-6 h-6 rounded bg-[#FC4C02] hover:bg-[#E34402] text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                    title="Atlama Ekle (+1)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Heart Rate Zone Strip */}
          {hrState.isConnected && hrState.currentBpm > 40 && (
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#71717A] mb-2">
                <span>
                  Nabız Bölgesi: <strong className="text-[#18181B]">{currentZone.name}</strong>
                </span>
                <span className="font-mono font-bold" style={{ color: currentZone.color }}>
                  {hrState.currentBpm} BPM
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EAECEF] overflow-hidden flex gap-1">
                {getHeartRateZones(hrState.maxHeartRateSetting).map((z) => (
                  <div
                    key={z.zone}
                    className="flex-1 h-full rounded-xs transition-all duration-300"
                    style={{
                      backgroundColor: z.color,
                      opacity: currentZone.zone === z.zone ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Classic Primary Recorder Controls */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-2xl mx-auto">
            {rideState === 'idle' && (
              <button
                type="button"
                onClick={handleStartRide}
                className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-base flex items-center justify-center gap-2.5 transition cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Sürüşü Başlat</span>
              </button>
            )}

            {rideState === 'recording' && (
              <>
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Duraklat</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddLap}
                  className="sm:w-40 min-h-[52px] px-4 rounded-xl bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] border border-[#E2E4E9] font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Repeat className="w-4 h-4 text-[#FC4C02]" />
                  <span>Tur ({laps.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJumpCount((c) => c + 1)}
                  className="sm:w-44 min-h-[52px] px-4 rounded-xl bg-[#FFF4EE] hover:bg-[#FFE6D8] text-[#FC4C02] border border-[#FCD5C3] font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+1 Atlama ({jumpCount})</span>
                </button>
              </>
            )}

            {rideState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Devam Et</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenFinishReview}
                  className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Flag className="w-4 h-4 text-[#FC4C02]" />
                  <span>Bitir & Kaydet</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recorded Laps / Splits List */}
        {laps.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E2E4E9] p-5 sm:p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#FC4C02]" />
              <span>Tur Bölümleri (Laps · {laps.length})</span>
            </h3>
            <div className="divide-y divide-[#ECEEF2]">
              {laps.map((lap) => (
                <div key={lap.lapNumber} className="py-3 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#18181B]">Tur #{lap.lapNumber}</span>
                  <span className="text-[#FC4C02] font-bold">{lap.distanceKm.toFixed(2)} km</span>
                  <span className="text-[#71717A]">{formatTime(lap.durationSec)}</span>
                  <span className="font-bold text-[#18181B]">{lap.avgSpeedKmH.toFixed(1)} km/sa</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Aero & Sensor Quick Tools */}
        <div className="bg-white rounded-xl border border-[#E2E4E9] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Sensörler & Sürüş Araçları
            </h3>
            <button
              type="button"
              onClick={() => setIsLiveStatsOverlayOpen((v) => !v)}
              className="min-h-[36px] px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{isLiveStatsOverlayOpen ? 'Özeti Gizle' : 'Detay & Aero'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setIsBluetoothModalOpen(true)}
              className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-2 cursor-pointer transition"
            >
              <Bluetooth className="w-4 h-4 text-[#FC4C02] shrink-0" />
              <span className="truncate">BLE Nabız Bandı</span>
            </button>

            {onOpenSafetySos && (
              <button
                type="button"
                onClick={onOpenSafetySos}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-2 cursor-pointer transition"
              >
                <Shield className="w-4 h-4 text-[#FC4C02] shrink-0" />
                <span className="truncate">Beacon Güvenlik</span>
              </button>
            )}

            {onOpenAiCoach && (
              <button
                type="button"
                onClick={onOpenAiCoach}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#FFF4EE] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-2 cursor-pointer transition"
              >
                <Gauge className="w-4 h-4 text-[#FC4C02] shrink-0" />
                <span className="truncate">Sürüş Koçu & PSI</span>
              </button>
            )}

            {onOpenSegments && (
              <button
                type="button"
                onClick={onOpenSegments}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-2 cursor-pointer transition"
              >
                <Zap className="w-4 h-4 text-[#FC4C02] shrink-0" />
                <span className="truncate">KOM Segmentleri</span>
              </button>
            )}

            {onOpenPelotonRadio && (
              <button
                type="button"
                onClick={onOpenPelotonRadio}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F0F1F4] border border-[#E2E4E9] text-xs font-semibold text-[#18181B] flex items-center gap-2 cursor-pointer transition"
              >
                <Radio className="w-4 h-4 text-[#FC4C02] shrink-0" />
                <span className="truncate">Grup Telsizi</span>
              </button>
            )}

            {onOpenGarmin && (
              <button
                type="button"
                onClick={onOpenGarmin}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F0F7FB] hover:bg-[#E1F0FA] border border-[#BCE1F5] text-xs font-semibold text-[#007AC2] flex items-center gap-2 cursor-pointer transition"
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span className="truncate">Garmin Connect</span>
              </button>
            )}

            {onOpenApiManagement && (
              <button
                type="button"
                onClick={onOpenApiManagement}
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FFF4EE] hover:bg-[#FFE6D8] border border-[#FCD5C3] text-xs font-semibold text-[#FC4C02] flex items-center gap-2 cursor-pointer transition"
              >
                <Key className="w-4 h-4 shrink-0" />
                <span className="truncate">Telemetri API</span>
              </button>
            )}
          </div>

          {isLiveStatsOverlayOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#ECEEF2] text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#71717A] uppercase block">Rüzgar Etkisi</span>
                  <strong className="text-[#18181B]">
                    {liveAero.typeLabel} ({Math.abs(liveAero.effectiveHeadwindKmH)} km/sa)
                  </strong>
                </div>
                <span className="font-mono font-bold text-[#FC4C02]">
                  {liveAero.wattImpact >= 0 ? `+${liveAero.wattImpact}W` : `${liveAero.wattImpact}W`}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#71717A] uppercase block">Tahmini Eğim</span>
                  <strong className="text-[#18181B]">{liveGradient.category}</strong>
                </div>
                <span className="font-mono font-bold" style={{ color: liveGradient.color }}>
                  %{liveGradient.gradientPercent}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Classic "Aktiviteyi Kaydet" (Finish & Save Activity) Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-[#E2E4E9] shadow-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FC4C02]">
                  KAMERASIZ GPS AKTİVİTE ÖZETİ
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#18181B]">
                  Aktiviteyi Kaydet
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] flex items-center justify-center text-[#71717A] cursor-pointer"
                title="Sürüşe Geri Dön"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-4 divide-x divide-[#ECEEF2] py-3 rounded-xl bg-[#F8F9FA] border border-[#E2E4E9] text-center">
              <div>
                <span className="text-[10px] font-bold text-[#71717A] block">MESAFE</span>
                <strong className="text-base font-bold font-mono text-[#FC4C02] tabular-nums">
                  {distanceKm.toFixed(2)} km
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#71717A] block">SÜRE</span>
                <strong className="text-base font-bold font-mono text-[#18181B] tabular-nums">
                  {formatTime(activeMovingSec)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#71717A] block">TIRMANIŞ</span>
                <strong className="text-base font-bold font-mono text-[#18181B] tabular-nums">
                  +{Math.round(climbM)} m
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#71717A] block">ATLAMA</span>
                <strong className="text-base font-bold font-mono text-[#FC4C02] tabular-nums">
                  {jumpCount}
                </strong>
              </div>
            </div>

            {/* Activity Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Aktivite Başlığı
              </label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Örn: Sabah Sahil Antrenmanı"
                className="w-full px-4 py-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] focus:border-[#FC4C02] text-sm font-semibold text-[#18181B] outline-none"
              />
            </div>

            {/* Sport Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Bisiklet / Spor Türü
              </label>
              <div className="flex flex-wrap gap-2">
                {SPORT_TYPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSaveSportType(s.id)}
                    className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      saveSportType === s.id
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-[#F8F9FA] text-[#52525B] border-[#E2E4E9]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Perceived Effort 1-10 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#71717A]">
                  Algılanan Efor
                </span>
                <span className="font-mono font-bold text-[#FC4C02]">{saveEffort} / 10</span>
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSaveEffort(lvl)}
                    className={`min-h-[36px] rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      saveEffort >= lvl
                        ? 'bg-[#FC4C02] text-white'
                        : 'bg-[#F8F9FA] text-[#71717A] border border-[#E2E4E9]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71717A] block">
                Sürüş Notları (İsteğe Bağlı)
              </label>
              <textarea
                rows={3}
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Hava durumu, rüzgar, yol kalitesi veya nasıl hissettiğinizi yazın..."
                className="w-full px-4 py-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] focus:border-[#FC4C02] text-xs sm:text-sm text-[#18181B] outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleConfirmSaveRide}
                className="w-full min-h-[48px] rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Aktiviteyi Kaydet</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleExportCurrentGpx()}
                  className="min-h-[44px] rounded-lg bg-[#F4F5F7] hover:bg-[#EAECEF] text-[#18181B] border border-[#E2E4E9] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Download className="w-4 h-4 text-[#FC4C02]" />
                  <span>GPX İndir</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardRide}
                  className={`min-h-[44px] rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                    confirmDiscard
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmDiscard ? 'Emin misin? Sil' : 'Sürüşü Sil'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bluetooth HR Monitor Modal */}
      <BluetoothHrModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
      />

      {/* Post-Ride Performance Modal */}
      <RideInsightsModal
        ride={finishedRideSummary}
        isOpen={Boolean(finishedRideSummary)}
        onClose={() => setFinishedRideSummary(null)}
        riderFtp={ftpWatts}
        onSaveRideNotes={(rideId, updatedTitle, notes) => {
          if (finishedRideSummary && finishedRideSummary.id === rideId) {
            const updated = { ...finishedRideSummary, title: updatedTitle, notes };
            setFinishedRideSummary(updated);
            onRideFinished(updated);
          }
        }}
        onExportGpx={(ride) => handleExportCurrentGpx(ride)}
      />
    </div>
  );
};
