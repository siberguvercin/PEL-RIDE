import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { QuotaBanner } from './components/QuotaBanner';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { GoogleMapView } from './components/GoogleMapView';
import { RideTrackerView } from './components/RideTrackerView';
import { EventsView } from './components/EventsView';
import { LiveChatView, PrivateChatTarget } from './components/LiveChatView';
import { ProfileView } from './components/ProfileView';
import { MarketView } from './components/MarketView';
import { ReelsView } from './components/ReelsView';
import { LiveStreamModal } from './components/LiveStreamModal';
import { StreamWatchModal } from './components/StreamWatchModal';
import { GroupRideModal } from './components/GroupRideModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { RiderProfileModal } from './components/RiderProfileModal';
import { LiveSegmentsModal } from './components/LiveSegmentsModal';
import { SafetySosModal } from './components/SafetySosModal';
import { AiCyclingCoachModal } from './components/AiCyclingCoachModal';
import { PelotonRadioModal } from './components/PelotonRadioModal';
import { BikeMaintenanceModal } from './components/BikeMaintenanceModal';
import { FloatingToolkit } from './components/FloatingToolkit';
import { BluetoothHrModal } from './components/BluetoothHrModal';
import { GarminConnectModal } from './components/GarminConnectModal';
import { ApiManagementModal } from './components/ApiManagementModal';
import { RouteDetailModal } from './components/RouteDetailModal';
import { RouteCollectionModal } from './components/RouteCollectionModal';
import { bluetoothHrService } from './services/bluetoothHrService';
import { garminService } from './services/garminService';
import {
  StreamSession,
  GroupRide,
  SavedRide,
  ActiveRider,
  LatLng,
  CyclingEvent,
  GoogleUserProfile,
  LeaderboardRider,
  CyclingRoute,
  PersistedUserBadge,
} from './types';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { Award } from 'lucide-react';
import {
  auth,
  ensureUserAccountDocs,
  fetchUserRides,
  persistUserRide,
  fetchUserBadges,
  persistUserBadges,
  signOutAccount,
  syncPublicProfile,
  subscribePublicProfiles,
} from './firebase';
import { AuthGate } from './components/AuthGate';
import { socketService } from './services/socket';
import { calculateUserRank } from './utils/rankings';
import { evaluateUserBadges } from './utils/badges';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBAYY5A1SNeAliQOGRw5SnFQNwYWDkAV_Y';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeStreams, setActiveStreams] = useState<StreamSession[]>([]);
  const [groupRides, setGroupRides] = useState<GroupRide[]>([]);
  const [events, setEvents] = useState<CyclingEvent[]>([]);
  const [activeRiders, setActiveRiders] = useState<ActiveRider[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRider[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [profileBio, setProfileBio] = useState<string>('Yol · Gravel · Dağ Bisikleti');
  const [profileWeightKg, setProfileWeightKg] = useState<number>(72);
  const [savedRides, setSavedRides] = useState<SavedRide[]>([]);
  const [persistedBadges, setPersistedBadges] = useState<PersistedUserBadge[]>([]);
  const [badgeToast, setBadgeToast] = useState<{ titles: string[]; totalXp: number } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentAltitude, setCurrentAltitude] = useState<number>(120);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [ftpWatts, setFtpWatts] = useState<number>(220);

  // Modals state
  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState<boolean>(false);
  const [broadcasterMode, setBroadcasterMode] = useState<'record' | 'live'>('record');
  const [watchingStream, setWatchingStream] = useState<StreamSession | null>(null);
  const [isGroupRideModalOpen, setIsGroupRideModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState<boolean>(false);
  const [inspectedRider, setInspectedRider] = useState<LeaderboardRider | null>(null);
  const [selectedChatRideId, setSelectedChatRideId] = useState<string | null>(null);
  const [selectedPrivateTarget, setSelectedPrivateTarget] = useState<PrivateChatTarget | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [directNormalRideKey, setDirectNormalRideKey] = useState<number>(0);

  const handleStartDirectNormalRide = () => {
    setIsBroadcasterOpen(false);
    setActiveTab('ride');
    setDirectNormalRideKey((k) => k + 1);
  };

  // Advanced Tech Modals
  const [isLiveSegmentsOpen, setIsLiveSegmentsOpen] = useState<boolean>(false);
  const [isSafetySosOpen, setIsSafetySosOpen] = useState<boolean>(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState<boolean>(false);
  const [isPelotonRadioOpen, setIsPelotonRadioOpen] = useState<boolean>(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState<boolean>(false);
  const [isBluetoothHrOpen, setIsBluetoothHrOpen] = useState<boolean>(false);
  const [isGarminConnectOpen, setIsGarminConnectOpen] = useState<boolean>(false);
  const [isApiManagementOpen, setIsApiManagementOpen] = useState<boolean>(false);
  const [garminSyncNotification, setGarminSyncNotification] = useState<string | null>(null);
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(0);
  const [incomingRadioAlert, setIncomingRadioAlert] = useState<{ title: string; sender: string } | null>(null);
  const [incomingEmergencyAlert, setIncomingEmergencyAlert] = useState<{ riderName: string; lat: number; lng: number } | null>(null);
  const [selectedPreloadedRoute, setSelectedPreloadedRoute] = useState<CyclingRoute | null>(null);
  const [inspectedRoute, setInspectedRoute] = useState<CyclingRoute | null>(null);
  const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState<boolean>(false);
  const [routeForCollectionModal, setRouteForCollectionModal] = useState<CyclingRoute | null>(null);

  const handleOpenCollections = () => {
    setRouteForCollectionModal(null);
    setIsCollectionsModalOpen(true);
  };

  const handleManageRouteCollections = (route: CyclingRoute) => {
    setRouteForCollectionModal(route);
    setIsCollectionsModalOpen(true);
  };

  // Subscribe to Bluetooth HR state
  useEffect(() => {
    const unHr = bluetoothHrService.subscribe((s) => {
      setCurrentHeartRate(s.currentBpm);
    });
    return () => unHr();
  }, []);

  // Purge any legacy hardcoded default account from localStorage and listen to Firebase Auth
  useEffect(() => {
    try {
      const legacyGoogle = localStorage.getItem('pel_google_user');
      if (legacyGoogle && legacyGoogle.includes('google-kaya-01')) {
        localStorage.removeItem('pel_google_user');
      }
      const legacyProfile = localStorage.getItem('pel_rider_profile');
      if (legacyProfile) {
        localStorage.removeItem('pel_rider_profile');
      }
    } catch (_) {}

    const hydrateVerifiedUser = async (user: FirebaseUser) => {
      const fallbackName =
        user.displayName?.trim() ||
        user.email?.split('@')[0] ||
        'Bisikletçi';

      const profileObj: GoogleUserProfile = {
        id: user.uid,
        name: fallbackName,
        email: user.email || '',
        photoUrl: user.photoURL || '',
        verified: user.emailVerified,
        providerId: user.providerData?.[0]?.providerId || 'google.com',
      };

      setFirebaseUser(user);
      setGoogleUser(profileObj);
      localStorage.setItem('pel_google_user', JSON.stringify(profileObj));

      socketService.setUser({
        id: user.uid,
        name: profileObj.name,
        avatar: profileObj.photoUrl,
      });

      const localRidesKey = `pel_saved_rides_${user.uid}`;
      try {
        const cached = localStorage.getItem(localRidesKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setSavedRides(parsed);
        } else {
          setSavedRides([]);
        }
      } catch (_) {
        setSavedRides([]);
      }

      try {
        const remoteProfile = await ensureUserAccountDocs(user);
        setProfileBio(remoteProfile.bio);
        setFtpWatts(remoteProfile.ftpWatts);
        setProfileWeightKg(remoteProfile.weightKg);
        if (remoteProfile.displayName && remoteProfile.displayName !== profileObj.name) {
          const syncedProfile = { ...profileObj, name: remoteProfile.displayName };
          setGoogleUser(syncedProfile);
          localStorage.setItem('pel_google_user', JSON.stringify(syncedProfile));
          socketService.setUser({
            id: user.uid,
            name: remoteProfile.displayName,
            avatar: profileObj.photoUrl,
          });
        }

        const remoteRides = await fetchUserRides(user.uid);
        setSavedRides(remoteRides);
        localStorage.setItem(localRidesKey, JSON.stringify(remoteRides));

        const remoteBadges = await fetchUserBadges(user.uid);
        const evaluatedRemote = evaluateUserBadges(remoteRides, remoteBadges);
        const persistedSet = new Set(remoteBadges.map((b) => b.badgeId));
        const missingEarned = evaluatedRemote.filter((b) => b.unlocked && !persistedSet.has(b.id));
        if (missingEarned.length > 0 && user.emailVerified) {
          const newlySaved = await persistUserBadges(user, missingEarned);
          setPersistedBadges([...remoteBadges, ...newlySaved]);
        } else {
          setPersistedBadges(remoteBadges);
        }
      } catch (err) {
        console.warn('Firestore user sync warning:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setGoogleUser(null);
        setSavedRides([]);
        setPersistedBadges([]);
        localStorage.removeItem('pel_google_user');
        setIsAuthLoading(false);
        return;
      }

      if (!user.emailVerified) {
        setFirebaseUser(user);
        setGoogleUser(null);
        setSavedRides([]);
        setPersistedBadges([]);
        localStorage.removeItem('pel_google_user');
        setIsAuthLoading(false);
        return;
      }

      await hydrateVerifiedUser(user);
    });

    return () => unsubAuth();
  }, []);

  // Clear unread chat badge when viewing chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  // Connect socket and synchronize state across devices
  useEffect(() => {
    socketService.connect();

    const unConn = socketService.on('connection_change', (connected) => {
      setIsConnected(connected);
    });

    const unInit = socketService.on('init_sync', (data) => {
      if (Array.isArray(data.streams)) setActiveStreams(data.streams);
      if (Array.isArray(data.rides)) setGroupRides(data.rides);
      if (Array.isArray(data.events)) setEvents(data.events);
      if (Array.isArray(data.riders)) setActiveRiders(data.riders);
      if (Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
        setLeaderboard(data.leaderboard);
      }
    });

    const unStreamStarted = socketService.on('stream_started', (data) => {
      if (data.stream) {
        setActiveStreams((prev) => [data.stream, ...prev.filter((s) => s.id !== data.stream.id)]);
      }
    });

    const unStreamEnded = socketService.on('stream_ended', (data) => {
      setActiveStreams((prev) => prev.filter((s) => s.id !== data.streamId));
      if (watchingStream?.id === data.streamId) {
        setWatchingStream(null);
      }
    });

    const unStreamViewers = socketService.on('stream_viewers_update', (data) => {
      setActiveStreams((prev) =>
        prev.map((s) => (s.id === data.streamId ? { ...s, viewers: data.viewers } : s))
      );
    });

    const unRiderUpdate = socketService.on('rider_location_update', (data) => {
      if (data.rider) {
        setActiveRiders((prev) => [
          data.rider,
          ...prev.filter((r) => r.id !== data.rider.id),
        ]);
      }
    });

    const unRiderRemoved = socketService.on('rider_removed', (data) => {
      setActiveRiders((prev) => prev.filter((r) => r.id !== data.riderId));
    });

    const unRideCreated = socketService.on('group_ride_created', (data) => {
      if (data.ride) {
        setGroupRides((prev) => [data.ride, ...prev.filter((r) => r.id !== data.ride.id)]);
      }
    });

    const unRideUpdated = socketService.on('group_ride_updated', (data) => {
      if (data.ride) {
        setGroupRides((prev) =>
          prev.map((r) => (r.id === data.ride.id ? data.ride : r))
        );
      }
    });

    const unEventUpdated = socketService.on('event_updated', (data) => {
      if (data.event) {
        setEvents((prev) =>
          prev.map((e) => (e.id === data.event.id ? data.event : e))
        );
      }
    });

    const unEventCreated = socketService.on('event_created', (data) => {
      if (data.event) {
        setEvents((prev) => [data.event, ...prev]);
      }
    });

    const unEventsCleared = socketService.on('events_cleared', () => {
      setEvents([]);
    });

    const unRadio = socketService.on('peloton_radio_signal', (data) => {
      setIncomingRadioAlert({ title: data.title, sender: data.senderName });
      setTimeout(() => setIncomingRadioAlert(null), 5000);
    });

    const unSos = socketService.on('emergency_sos_alert', (data) => {
      setIncomingEmergencyAlert({
        riderName: data.riderName,
        lat: data.lat,
        lng: data.lng
      });
    });

    const unChatBadge = socketService.on('new_chat_message', (data) => {
      const me = socketService.getUser();
      if (data?.message && data.message.userId !== me.id && activeTab !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
    });

    return () => {
      unConn();
      unInit();
      unStreamStarted();
      unStreamEnded();
      unStreamViewers();
      unRiderUpdate();
      unRiderRemoved();
      unRideCreated();
      unRideUpdated();
      unEventUpdated();
      unEventCreated();
      unEventsCleared();
      unRadio();
      unSos();
      unChatBadge();
    };
  }, [watchingStream, activeTab]);

  // Initial events fetch & real-time Firestore community leaderboard subscription
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((err) => console.warn('Events fetch error:', err));

    let unsubPublic: (() => void) | undefined;
    try {
      unsubPublic = subscribePublicProfiles((_profiles, nextLeaderboard) => {
        setLeaderboard(nextLeaderboard);
      });
    } catch (err) {
      console.warn('Public profiles subscription warning:', err);
    }
    return () => {
      if (unsubPublic) unsubPublic();
    };
  }, []);

  // Geolocation tracker
  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, altitude, speed } = pos.coords;
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          alt: altitude || 0,
          ts: pos.timestamp
        });
        if (speed && speed > 0) setCurrentSpeed(speed * 3.6);
        if (altitude) setCurrentAltitude(altitude);
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const handleRideFinished = async (newRide: SavedRide) => {
    const prevEvaluated = evaluateUserBadges(savedRides, persistedBadges);
    const prevUnlockedIds = new Set(prevEvaluated.filter((b) => b.unlocked).map((b) => b.id));

    const updated = [newRide, ...savedRides];
    setSavedRides(updated);

    const nextEvaluated = evaluateUserBadges(updated, persistedBadges);
    const newlyUnlocked = nextEvaluated.filter((b) => b.unlocked && !prevUnlockedIds.has(b.id));

    if (newlyUnlocked.length > 0) {
      const totalXp = newlyUnlocked.reduce((acc, b) => acc + b.xpReward, 0);
      setBadgeToast({
        titles: newlyUnlocked.map((b) => b.title),
        totalXp,
      });
      setTimeout(() => setBadgeToast(null), 5500);
    }

    if (firebaseUser) {
      localStorage.setItem(`pel_saved_rides_${firebaseUser.uid}`, JSON.stringify(updated));
      try {
        await persistUserRide(firebaseUser, newRide);
        if (newlyUnlocked.length > 0 && firebaseUser.emailVerified) {
          const savedBadges = await persistUserBadges(firebaseUser, newlyUnlocked);
          if (savedBadges.length > 0) {
            setPersistedBadges((prev) => {
              const known = new Set(prev.map((p) => p.badgeId));
              return [...prev, ...savedBadges.filter((s) => !known.has(s.badgeId))];
            });
          }
        }
      } catch (err) {
        console.warn('Firestore ride/badge save warning:', err);
      }
    }

    // Auto-sync with Garmin Connect
    if (garminService.getState().autoUploadRides) {
      try {
        const syncRes = await garminService.syncRideToGarmin(newRide);
        if (syncRes.success) {
          setGarminSyncNotification(
            `Aktivite Garmin Connect™ hesabınıza aktarıldı (${syncRes.activityId})`
          );
          setTimeout(() => setGarminSyncNotification(null), 4500);
        }
      } catch (err) {
        console.warn('Garmin auto-sync warning:', err);
      }
    }
  };

  const handleUpdateUserProfile = async (updates: {
    displayName?: string;
    bio?: string;
    ftpWatts?: number;
    weightKg?: number;
  }) => {
    if (updates.bio !== undefined) setProfileBio(updates.bio);
    if (updates.ftpWatts !== undefined) setFtpWatts(updates.ftpWatts);
    if (updates.weightKg !== undefined) setProfileWeightKg(updates.weightKg);
    if (updates.displayName && googleUser) {
      const updatedUser = { ...googleUser, name: updates.displayName };
      setGoogleUser(updatedUser);
      localStorage.setItem('pel_google_user', JSON.stringify(updatedUser));
    }
    if (firebaseUser) {
      try {
        await ensureUserAccountDocs(firebaseUser, updates);
      } catch (err) {
        console.warn('Firestore profile update warning:', err);
      }
    }
  };

  const handleExportGpx = (ride: SavedRide) => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PEL Companion">
  <metadata>
    <name>${ride.title}</name>
    <time>${ride.date}</time>
  </metadata>
  <trk>
    <name>${ride.title}</name>
    <trkseg>
      ${ride.points
        .map(
          (p) => `<trkpt lat="${p.lat}" lon="${p.lng}">
        <ele>${p.alt || 0}</ele>
        <time>${p.ts ? new Date(p.ts).toISOString() : new Date().toISOString()}</time>
      </trkpt>`
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

  const handleGoToChat = (roomId?: string) => {
    if (roomId) setSelectedChatRideId(roomId);
    setActiveTab('chat');
  };

  const handleSelectEventLocation = (lat: number, lng: number) => {
    setActiveTab('map');
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, altitude, speed } = pos.coords;
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          alt: altitude || 0,
          ts: pos.timestamp
        });
        if (speed && speed > 0) setCurrentSpeed(speed * 3.6);
        if (altitude) setCurrentAltitude(altitude);
      },
      (err) => {
        console.warn('Geolocation request warning:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleInspectRider = (rider: LeaderboardRider) => {
    setInspectedRider(rider);
  };

  const handleInspectRiderByName = (name: string) => {
    const found = leaderboard.find(
      (r) => r.name.toLowerCase() === name.toLowerCase() || r.name.toLowerCase().includes(name.toLowerCase())
    );
    if (found) {
      setInspectedRider(found);
      return;
    }

    const onlineMatch = socketService.getOnlineUsers().find(
      (u) => u.userName.toLowerCase() === name.toLowerCase() || u.userName.toLowerCase().includes(name.toLowerCase())
    );
    if (onlineMatch) {
      setInspectedRider({
        rank: 0,
        id: onlineMatch.userId,
        name: onlineMatch.userName,
        avatar: onlineMatch.userAvatar,
        tier: 'Bronze',
        divisionName: 'Kulüp Üyesi',
        points: 0,
        totalDistanceKm: 0,
        totalClimbM: 0,
        ftpWatts: 220,
        wattsPerKg: 3.06,
        ridesCount: 0,
        isOnline: onlineMatch.isOnline,
        isLive: false,
      });
    }
  };

  const totalKm = savedRides.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalClimb = savedRides.reduce((acc, r) => acc + r.climbM, 0);
  const rank = calculateUserRank({
    totalDistanceKm: totalKm,
    totalClimbM: totalClimb,
    ftpWatts,
    ridesCount: savedRides.length,
  });

  // Keep user's non-PII public profile synchronized with Firestore for live club directory & leaderboard
  useEffect(() => {
    if (!firebaseUser || !googleUser) return;
    syncPublicProfile(firebaseUser, {
      displayName: googleUser.name,
      photoUrl: googleUser.photoUrl || '',
      bio: profileBio,
      ftpWatts,
      totalDistanceKm: totalKm,
      totalClimbM: totalClimb,
      ridesCount: savedRides.length,
      points: rank.points,
      tier: rank.division.tier,
      divisionName: rank.division.name,
      isOnline: true,
    }).catch((err) => console.warn('Public profile sync warning:', err));
  }, [firebaseUser, googleUser, profileBio, ftpWatts, totalKm, totalClimb, savedRides.length, rank.points, rank.division.tier, rank.division.name]);

  if (isAuthLoading || !googleUser) {
    return (
      <AuthGate
        isLoading={isAuthLoading}
        unverifiedUser={firebaseUser && !firebaseUser.emailVerified ? firebaseUser : null}
        onVerificationConfirmed={async (verifiedUser) => {
          const fallbackName =
            verifiedUser.displayName?.trim() ||
            verifiedUser.email?.split('@')[0] ||
            'Bisikletçi';
          const profileObj: GoogleUserProfile = {
            id: verifiedUser.uid,
            name: fallbackName,
            email: verifiedUser.email || '',
            photoUrl: verifiedUser.photoURL || '',
            verified: verifiedUser.emailVerified,
            providerId: verifiedUser.providerData?.[0]?.providerId || 'password',
          };
          setFirebaseUser(verifiedUser);
          setGoogleUser(profileObj);
          localStorage.setItem('pel_google_user', JSON.stringify(profileObj));
          socketService.setUser({
            id: verifiedUser.uid,
            name: profileObj.name,
            avatar: profileObj.photoUrl,
          });
          try {
            const remoteProfile = await ensureUserAccountDocs(verifiedUser);
            setProfileBio(remoteProfile.bio);
            setFtpWatts(remoteProfile.ftpWatts);
            setProfileWeightKg(remoteProfile.weightKg);
            const remoteRides = await fetchUserRides(verifiedUser.uid);
            setSavedRides(remoteRides);
            localStorage.setItem(`pel_saved_rides_${verifiedUser.uid}`, JSON.stringify(remoteRides));

            const remoteBadges = await fetchUserBadges(verifiedUser.uid);
            const evaluatedRemote = evaluateUserBadges(remoteRides, remoteBadges);
            const persistedSet = new Set(remoteBadges.map((b) => b.badgeId));
            const missingEarned = evaluatedRemote.filter((b) => b.unlocked && !persistedSet.has(b.id));
            if (missingEarned.length > 0 && verifiedUser.emailVerified) {
              const newlySaved = await persistUserBadges(verifiedUser, missingEarned);
              setPersistedBadges([...remoteBadges, ...newlySaved]);
            } else {
              setPersistedBadges(remoteBadges);
            }
          } catch (err) {
            console.warn('Firestore verified user sync warning:', err);
          }
        }}
      />
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker']}>
      <div className="flex flex-col h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-hidden bg-[#F4F5F7] text-[#18181B] overscroll-x-none">
        {/* Google Maps Quota Banner */}
        <QuotaBanner />

        {/* Global Header */}
        <Header
          activeStreams={activeStreams}
          googleUser={googleUser}
          rank={rank}
          onOpenLiveBroadcaster={() => {
            setBroadcasterMode('live');
            setIsBroadcasterOpen(true);
          }}
          onStartDirectNormalRide={handleStartDirectNormalRide}
          onWatchStream={(stream) => setWatchingStream(stream)}
          onGoToChat={() => setActiveTab('chat')}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
          onOpenApiManagement={() => setIsApiManagementOpen(true)}
          onOpenAiCoach={() => setIsAiCoachOpen(true)}
          isConnected={isConnected}
          unreadChatCount={unreadChatCount}
        />

        {/* Calm Beacon Alert Toast (Non-alarmist) */}
        {incomingEmergencyAlert && (
          <div className="bg-white border-b border-[#E5E5EB] shadow-sm px-4 py-2.5 flex items-center justify-between text-xs text-[#242428] z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FC4C02]" />
              <span className="font-extrabold text-[#FC4C02]">BEACON GÜVENLİK:</span>
              <span className="font-medium text-[#242428]">{incomingEmergencyAlert.riderName} konum bildirimi paylaştı.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('map');
                  setIncomingEmergencyAlert(null);
                }}
                className="px-3 py-1 rounded bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold cursor-pointer transition text-xs"
              >
                Haritada Gör
              </button>
              <button
                onClick={() => setIncomingEmergencyAlert(null)}
                className="text-[#878792] hover:text-[#242428] cursor-pointer font-bold px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tactical Radio Notification Toast */}
        {incomingRadioAlert && (
          <div className="bg-white border-b border-[#E5E5EB] shadow-sm px-4 py-2 flex items-center justify-between text-xs text-[#242428] z-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FC4C02]" />
              <span className="font-extrabold text-[#242428]">Grup İletisi:</span>
              <span className="font-medium text-[#494950]">{incomingRadioAlert.title}</span>
              <span className="text-[#878792] hidden sm:inline">({incomingRadioAlert.sender})</span>
            </div>
            <button
              onClick={() => setIncomingRadioAlert(null)}
              className="text-[#878792] hover:text-[#242428] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Live Broadcast Banner */}
        {activeStreams.length > 0 && activeTab !== 'home' && (
          <div className="bg-white border-b border-[#E5E5EB] shadow-sm px-4 py-2 flex items-center justify-between text-xs text-[#242428]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FC4C02] animate-pulse" />
              <span className="font-extrabold text-[#FC4C02]">CANLI:</span>
              <span className="text-[#242428] font-bold">{activeStreams[0].title}</span>
              <span className="text-[#878792] hidden sm:inline">({activeStreams[0].streamerName})</span>
            </div>
            <button
              onClick={() => setWatchingStream(activeStreams[0])}
              className="px-3 py-1 rounded bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Yayını İzle
            </button>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 w-full max-w-full overflow-hidden relative flex flex-col bg-[#F4F5F7]">
          {activeTab === 'home' && (
            <HomeView
              activeStreams={activeStreams}
              groupRides={groupRides}
              savedRides={savedRides}
              events={events}
              ftpWatts={ftpWatts}
              currentLocation={currentLocation}
              onRequestLocation={handleRequestLocation}
              onOpenLiveBroadcaster={() => {
                setBroadcasterMode('live');
                setIsBroadcasterOpen(true);
              }}
              onStartDirectNormalRide={handleStartDirectNormalRide}
              onWatchStream={(stream) => setWatchingStream(stream)}
              onGoToMap={() => setActiveTab('map')}
              onGoToRide={() => setActiveTab('ride')}
              onGoToChat={handleGoToChat}
              onGoToEvents={() => setActiveTab('events')}
              onOpenGroupRideModal={() => setIsGroupRideModalOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onOpenLiveSegments={() => setIsLiveSegmentsOpen(true)}
              onOpenSafetySos={() => setIsSafetySosOpen(true)}
              onOpenAiCoach={() => setIsAiCoachOpen(true)}
              onOpenPelotonRadio={() => setIsPelotonRadioOpen(true)}
              onOpenMaintenance={() => setIsMaintenanceOpen(true)}
              onOpenBluetoothHr={() => setIsBluetoothHrOpen(true)}
              onSelectRouteOnMap={(route) => {
                setSelectedPreloadedRoute(route);
                setActiveTab('map');
              }}
              onStartRideWithRoute={(route) => {
                setSelectedPreloadedRoute(route);
                setActiveTab('ride');
              }}
              onInspectRoute={(route) => setInspectedRoute(route)}
              onOpenCollections={handleOpenCollections}
              onManageRouteCollections={handleManageRouteCollections}
              onGoToReels={() => setActiveTab('reels')}
              onGoToMarket={() => setActiveTab('market')}
            />
          )}

          {activeTab === 'map' && (
            <GoogleMapView
              currentLocation={currentLocation}
              activeRiders={activeRiders}
              selectedPreloadedRoute={selectedPreloadedRoute}
              savedRides={savedRides}
              ftpWatts={ftpWatts}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onSelectTrail={() => setActiveTab('ride')}
              onSelectRoute={(route) => {
                setSelectedPreloadedRoute(route);
                setActiveTab('ride');
              }}
              onSelectRiderByName={handleInspectRiderByName}
              onOpenSegments={() => setIsLiveSegmentsOpen(true)}
              onOpenCollections={handleOpenCollections}
              onManageRouteCollections={handleManageRouteCollections}
            />
          )}

          {activeTab === 'ride' && (
            <RideTrackerView
              currentLocation={currentLocation}
              onRideFinished={handleRideFinished}
              onStartLiveBroadcast={() => {
                setBroadcasterMode('live');
                setIsBroadcasterOpen(true);
              }}
              autoStartKey={directNormalRideKey}
              onOpenSegments={() => setIsLiveSegmentsOpen(true)}
              onOpenSafetySos={() => setIsSafetySosOpen(true)}
              onOpenAiCoach={() => setIsAiCoachOpen(true)}
              onOpenPelotonRadio={() => setIsPelotonRadioOpen(true)}
              onOpenGarmin={() => setIsGarminConnectOpen(true)}
              onOpenApiManagement={() => setIsApiManagementOpen(true)}
              ftpWatts={ftpWatts}
            />
          )}

          {activeTab === 'reels' && (
            <ReelsView
              savedRides={savedRides}
              onStartPrivateChat={(target) => {
                setSelectedPrivateTarget(target);
                setActiveTab('chat');
              }}
            />
          )}

          {activeTab === 'market' && (
            <MarketView />
          )}

          {activeTab === 'events' && (
            <EventsView
              events={events}
              onSelectEventLocation={handleSelectEventLocation}
              onGoToChat={handleGoToChat}
            />
          )}

          {activeTab === 'chat' && (
            <LiveChatView
              rides={groupRides}
              leaderboard={leaderboard}
              selectedRideId={selectedChatRideId}
              selectedPrivateTarget={selectedPrivateTarget}
              onClearPrivateTarget={() => setSelectedPrivateTarget(null)}
              onSelectRiderByName={handleInspectRiderByName}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              savedRides={savedRides}
              persistedBadges={persistedBadges}
              googleUser={googleUser}
              profileBio={profileBio}
              profileFtpWatts={ftpWatts}
              profileWeightKg={profileWeightKg}
              onUpdateProfile={handleUpdateUserProfile}
              onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onExportGpx={handleExportGpx}
              onOpenGarmin={() => setIsGarminConnectOpen(true)}
              onOpenApiManagement={() => setIsApiManagementOpen(true)}
              onNavigateToReels={() => setActiveTab('reels')}
            />
          )}
        </main>

        {/* Global Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'chat') setSelectedChatRideId(null);
          }}
          activeStreamsCount={activeStreams.length}
          unreadChatCount={unreadChatCount}
        />

        {/* Live Stream & Normal Camera Recorder Modal */}
        <LiveStreamModal
          isOpen={isBroadcasterOpen}
          onClose={() => setIsBroadcasterOpen(false)}
          currentSpeed={currentSpeed}
          currentAltitude={currentAltitude}
          currentDistance={currentDistance}
          currentLocation={currentLocation}
          currentHeartRate={currentHeartRate}
          initialMode={broadcasterMode}
          onReelPublished={() => setActiveTab('reels')}
        />

        {/* Live Stream Spectator Modal */}
        <StreamWatchModal
          stream={watchingStream}
          onClose={() => setWatchingStream(null)}
        />

        {/* Group Ride Join/Create Modal */}
        <GroupRideModal
          isOpen={isGroupRideModalOpen}
          onClose={() => setIsGroupRideModalOpen(false)}
          onRideJoined={(code) => handleGoToChat(code)}
        />

        {/* Global Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          onSelectRider={handleInspectRider}
          leaderboard={leaderboard}
          currentUserId={firebaseUser?.uid}
          userStats={{
            name: googleUser?.name || 'Bisikletçi',
            points: rank.points,
            totalDistanceKm: totalKm,
            totalClimbM: totalClimb,
            ftpWatts,
            ridesCount: savedRides.length,
          }}
        />

        {/* Rider Profile Inspection Modal */}
        <RiderProfileModal
          isOpen={!!inspectedRider}
          rider={inspectedRider}
          onClose={() => setInspectedRider(null)}
          onStartChatWithRider={(name) => {
            const targetId = inspectedRider?.id || ('rider-' + name.toLowerCase().replace(/[^a-z0-9]/g, ''));
            setSelectedPrivateTarget({
              userId: targetId,
              userName: name,
              userAvatar: inspectedRider?.avatar
            });
            setActiveTab('chat');
          }}
        />

        {/* Google Authentication Modal */}
        <GoogleAuthModal
          isOpen={isGoogleAuthOpen}
          onClose={() => setIsGoogleAuthOpen(false)}
          currentUser={googleUser}
          onSignOut={() => {
            signOutAccount().catch(() => {});
            setGoogleUser(null);
            setFirebaseUser(null);
            setSavedRides([]);
            setPersistedBadges([]);
            localStorage.removeItem('pel_google_user');
          }}
        />

        {/* Floating Quick Pro Toolkit Trigger (hidden on ride/chat/reels to prevent button overlap) */}
        {activeTab !== 'ride' && activeTab !== 'chat' && activeTab !== 'reels' && (
          <FloatingToolkit
            onOpenSegments={() => setIsLiveSegmentsOpen(true)}
            onOpenSos={() => setIsSafetySosOpen(true)}
            onOpenCoach={() => setIsAiCoachOpen(true)}
            onOpenRadio={() => setIsPelotonRadioOpen(true)}
            onOpenMaintenance={() => setIsMaintenanceOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenBluetoothHr={() => setIsBluetoothHrOpen(true)}
            onOpenGarmin={() => setIsGarminConnectOpen(true)}
            onOpenApiManagement={() => setIsApiManagementOpen(true)}
            onOpenCollections={handleOpenCollections}
          />
        )}

        {/* Live KOM Segments Modal */}
        <LiveSegmentsModal
          isOpen={isLiveSegmentsOpen}
          onClose={() => setIsLiveSegmentsOpen(false)}
          onSelectSegmentLocation={(lat, lng) => {
            setActiveTab('map');
            setIsLiveSegmentsOpen(false);
          }}
        />

        {/* Beacon & Safety Check Modal (Toned down, calm) */}
        <SafetySosModal
          isOpen={isSafetySosOpen}
          onClose={() => setIsSafetySosOpen(false)}
          currentLocation={currentLocation}
          currentSpeed={currentSpeed}
        />

        {/* Cycling Performance Coach & Tire Pressure Modal */}
        <AiCyclingCoachModal
          isOpen={isAiCoachOpen}
          onClose={() => setIsAiCoachOpen(false)}
          ftpWatts={ftpWatts}
          weightKg={profileWeightKg}
          userName={googleUser.name}
          savedRides={savedRides}
          currentLocation={currentLocation}
          currentSpeed={currentSpeed}
          currentAltitude={currentAltitude}
          currentHeartRate={currentHeartRate}
        />

        {/* Peloton Radio & Signals Modal */}
        <PelotonRadioModal
          isOpen={isPelotonRadioOpen}
          onClose={() => setIsPelotonRadioOpen(false)}
          activeRidersCount={activeRiders.length || 14}
        />

        {/* Bike Garage & Component Wear Maintenance Modal */}
        <BikeMaintenanceModal
          isOpen={isMaintenanceOpen}
          onClose={() => setIsMaintenanceOpen(false)}
        />

        {/* Bluetooth Heart Rate Monitor Modal */}
        <BluetoothHrModal
          isOpen={isBluetoothHrOpen}
          onClose={() => setIsBluetoothHrOpen(false)}
        />

        {/* Garmin Connect Integration Modal */}
        <GarminConnectModal
          isOpen={isGarminConnectOpen}
          onClose={() => setIsGarminConnectOpen(false)}
          savedRides={savedRides}
        />

        {/* 3x API & Telemetry Management Modal */}
        <ApiManagementModal
          isOpen={isApiManagementOpen}
          onClose={() => setIsApiManagementOpen(false)}
        />

        {/* Route Detail & Elevation Profile Modal */}
        {inspectedRoute && (
          <RouteDetailModal
            route={inspectedRoute}
            currentWindDeg={45}
            onClose={() => setInspectedRoute(null)}
            onLoadOnMap={(r) => {
              setSelectedPreloadedRoute(r);
              setActiveTab('map');
            }}
            onStartRide={(r) => {
              setSelectedPreloadedRoute(r);
              setActiveTab('ride');
            }}
            onManageCollections={handleManageRouteCollections}
          />
        )}

        {/* Route Collection Management Modal (Favorilerim, Haftalık Hedefler, Zorlu Parkurlar, vb.) */}
        <RouteCollectionModal
          isOpen={isCollectionsModalOpen}
          onClose={() => {
            setIsCollectionsModalOpen(false);
            setRouteForCollectionModal(null);
          }}
          routeToManage={routeForCollectionModal}
          onSelectRouteOnMap={(route) => {
            setSelectedPreloadedRoute(route);
            setActiveTab('map');
            setIsCollectionsModalOpen(false);
          }}
          onSelectCollectionOnMap={(collection) => {
            setActiveTab('map');
            setIsCollectionsModalOpen(false);
          }}
        />

        {/* Garmin Auto-Sync Notification Toast */}
        {garminSyncNotification && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#007AC2] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3 duration-200">
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2L3 18h18L12 2zm0 4.2L17.5 15H6.5L12 6.2z" />
            </svg>
            <span>{garminSyncNotification}</span>
          </div>
        )}

        {/* Milestone Badge Unlock Notification Toast */}
        {badgeToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white border border-[#E2E4E9] shadow-lg rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#FC4C02] text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02]">
                  Yeni Başarı Rozeti · +{badgeToast.totalXp} XP
                </p>
                <p className="text-xs font-semibold text-[#18181B] truncate">
                  {badgeToast.titles.join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setBadgeToast(null);
                setActiveTab('profile');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E4E9] text-[#18181B] text-[11px] font-bold shrink-0 cursor-pointer transition"
            >
              Profilde Gör
            </button>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
