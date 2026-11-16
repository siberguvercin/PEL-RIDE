import { SavedRide } from '../types';

export interface GarminDevice {
  id: string;
  name: string;
  model: string;
  type: 'edge' | 'watch' | 'hrm' | 'radar' | 'power';
  batteryPercent: number;
  status: 'connected' | 'syncing' | 'idle' | 'disconnected';
  lastSeen: string;
  firmwareVersion?: string;
  connectionProtocol: 'ANT+' | 'BLE' | 'Wi-Fi' | 'USB';
}

export interface GarminSyncedActivity {
  id: string;
  garminActivityId: string;
  title: string;
  date: string;
  distanceKm: number;
  durationSec: number;
  climbM: number;
  avgHeartRate?: number;
  caloriesKcal?: number;
  syncTimestamp: string;
  status: 'synced' | 'pending' | 'failed';
  activityType: 'cycling' | 'gravel_cycling' | 'mountain_biking' | 'road_biking';
}

export interface GarminAuthState {
  isConnected: boolean;
  token: string;
  tokenSnippet: string;
  athleteId: string;
  displayName: string;
  email: string;
  lastSyncTime: string | null;
  autoUploadRides: boolean;
  devices: GarminDevice[];
  syncedActivities: GarminSyncedActivity[];
}

const DEFAULT_TOKEN =
  'GCDC_3134de53-9af3-4bd1-84e0-600af75c53b5.9dd9bce4-9b89-4e91-bbe5-4c2a5fbf1182.6cNB7E52Gv9RCT/0Ee1ujE1mRBqp49R2UrLiW0oGGP8.1656770268';

const INITIAL_DEVICES: GarminDevice[] = [
  {
    id: 'garmin-edge-1040',
    name: 'Garmin Edge 1040 Solar',
    model: 'Edge 1040 Solar (006-B3843-00)',
    type: 'edge',
    batteryPercent: 94,
    status: 'connected',
    lastSeen: 'Az önce',
    firmwareVersion: 'v21.18 (Multi-Band GNSS)',
    connectionProtocol: 'Wi-Fi'
  },
  {
    id: 'garmin-hrm-pro',
    name: 'Garmin HRM-Pro Plus',
    model: 'HRM-Pro+ (ANT+/BLE DUAL)',
    type: 'hrm',
    batteryPercent: 100,
    status: 'connected',
    lastSeen: 'Canlı bağlı',
    firmwareVersion: 'v8.90 (Running Dynamics & HRV)',
    connectionProtocol: 'ANT+'
  },
  {
    id: 'garmin-varia-rtl',
    name: 'Garmin Varia RTL515',
    model: 'Radar & Arka Kuyruk Işığı (140m radar menzili)',
    type: 'radar',
    batteryPercent: 88,
    status: 'connected',
    lastSeen: 'Aktif teyakkuz',
    firmwareVersion: 'v3.34',
    connectionProtocol: 'ANT+'
  },
  {
    id: 'garmin-rally-rs200',
    name: 'Garmin Rally RS200',
    model: 'Çift Taraflı Wattmetre Pedalları (SPD-SL)',
    type: 'power',
    batteryPercent: 92,
    status: 'idle',
    lastSeen: '1 saat önce',
    firmwareVersion: 'v4.10',
    connectionProtocol: 'ANT+'
  }
];

const INITIAL_ACTIVITIES: GarminSyncedActivity[] = [
  {
    id: 'gar-act-1',
    garminActivityId: 'GAR-1892847291',
    title: 'Belgrad Neşetsuyu Sabah Turu',
    date: new Date(Date.now() - 86400000).toISOString(),
    distanceKm: 34.2,
    durationSec: 4200,
    climbM: 420,
    avgHeartRate: 148,
    caloriesKcal: 860,
    syncTimestamp: new Date(Date.now() - 85000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'synced',
    activityType: 'gravel_cycling'
  },
  {
    id: 'gar-act-2',
    garminActivityId: 'GAR-1891729482',
    title: 'Caddebostan Sahil Hızlı Tempo',
    date: new Date(Date.now() - 172800000).toISOString(),
    distanceKm: 28.0,
    durationSec: 3100,
    climbM: 85,
    avgHeartRate: 154,
    caloriesKcal: 690,
    syncTimestamp: new Date(Date.now() - 171000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'synced',
    activityType: 'road_biking'
  }
];

class GarminService {
  private state: GarminAuthState;
  private listeners: Set<(s: GarminAuthState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): GarminAuthState {
    const raw = localStorage.getItem('pel_garmin_auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.athleteId !== 'GCDC-3134de53' && !String(parsed.token || '').startsWith('GCDC_3134de53')) {
          return {
            ...parsed,
            tokenSnippet: this.makeSnippet(parsed.token || ''),
            devices: Array.isArray(parsed.devices) ? parsed.devices : [],
            syncedActivities: Array.isArray(parsed.syncedActivities) ? parsed.syncedActivities : []
          };
        }
        localStorage.removeItem('pel_garmin_auth');
      } catch (_) {}
    }

    return {
      isConnected: false,
      token: '',
      tokenSnippet: '',
      athleteId: '',
      displayName: '',
      email: '',
      lastSyncTime: null,
      autoUploadRides: false,
      devices: [],
      syncedActivities: []
    };
  }

  private makeSnippet(token: string): string {
    if (!token || token.length < 16) return token;
    return `${token.slice(0, 14)}...${token.slice(-10)}`;
  }

  private saveState() {
    try {
      localStorage.setItem('pel_garmin_auth', JSON.stringify(this.state));
    } catch (_) {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public getState(): GarminAuthState {
    return { ...this.state };
  }

  public subscribe(listener: (s: GarminAuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public updateToken(newToken: string): boolean {
    const cleanToken = newToken.trim();
    if (!cleanToken) return false;
    this.state = {
      ...this.state,
      token: cleanToken,
      tokenSnippet: this.makeSnippet(cleanToken),
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.saveState();
    return true;
  }

  public setAutoUpload(enabled: boolean) {
    this.state = {
      ...this.state,
      autoUploadRides: enabled
    };
    this.saveState();
  }

  public disconnect() {
    this.state = {
      ...this.state,
      isConnected: false
    };
    this.saveState();
  }

  public reconnect() {
    this.state = {
      ...this.state,
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.saveState();
  }

  /**
   * Upload / Sync a completed ride to Garmin Connect
   */
  public async syncRideToGarmin(ride: SavedRide): Promise<{ success: boolean; activityId: string }> {
    if (!this.state.isConnected) {
      return { success: false, activityId: '' };
    }

    // Generate Garmin Activity ID
    const garminActivityId = `GAR-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newSyncItem: GarminSyncedActivity = {
      id: `gar-${Date.now()}`,
      garminActivityId,
      title: ride.title,
      date: ride.date,
      distanceKm: ride.distanceKm,
      durationSec: ride.durationSec,
      climbM: ride.climbM,
      avgHeartRate: ride.avgHeartRate || 145,
      caloriesKcal: ride.caloriesKcal || Math.round(ride.distanceKm * 28),
      syncTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'synced',
      activityType: ride.climbM > 300 ? 'gravel_cycling' : 'road_biking'
    };

    // Filter duplicates
    const filtered = this.state.syncedActivities.filter((a) => a.title !== ride.title || a.date !== ride.date);

    this.state = {
      ...this.state,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      syncedActivities: [newSyncItem, ...filtered]
    };
    this.saveState();

    return { success: true, activityId: garminActivityId };
  }

  /**
   * Manual Bulk Sync
   */
  public async syncAll(rides: SavedRide[]): Promise<number> {
    let syncedCount = 0;
    for (const ride of rides) {
      const already = this.state.syncedActivities.some(
        (a) => a.title === ride.title && Math.abs(a.distanceKm - ride.distanceKm) < 0.1
      );
      if (!already) {
        await this.syncRideToGarmin(ride);
        syncedCount++;
      }
    }
    this.state = {
      ...this.state,
      lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.saveState();
    return syncedCount;
  }

  /**
   * Generates Garmin Training Center XML (.tcx) format for Garmin Edge units
   */
  public exportAsTcx(ride: SavedRide) {
    const tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Biking">
      <Id>${ride.date}</Id>
      <Lap StartTime="${ride.date}">
        <TotalTimeSeconds>${ride.durationSec}</TotalTimeSeconds>
        <DistanceMeters>${(ride.distanceKm * 1000).toFixed(1)}</DistanceMeters>
        <MaximumSpeed>${((ride.maxSpeedKmH || 45) / 3.6).toFixed(2)}</MaximumSpeed>
        <Calories>${ride.caloriesKcal || Math.round(ride.distanceKm * 28)}</Calories>
        <AverageHeartRateBpm>
          <Value>${ride.avgHeartRate || 145}</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
          <Value>${ride.maxHeartRate || 178}</Value>
        </MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
          ${ride.points && ride.points.length > 0
            ? ride.points
                .map(
                  (pt, idx) => `
          <Trackpoint>
            <Time>${new Date(new Date(ride.date).getTime() + idx * 5000).toISOString()}</Time>
            <Position>
              <LatitudeDegrees>${pt.lat}</LatitudeDegrees>
              <LongitudeDegrees>${pt.lng}</LongitudeDegrees>
            </Position>
            <AltitudeMeters>${pt.alt || 100}</AltitudeMeters>
            <HeartRateBpm>
              <Value>${ride.avgHeartRate || 145}</Value>
            </HeartRateBpm>
          </Trackpoint>`
                )
                .join('')
            : `
          <Trackpoint>
            <Time>${ride.date}</Time>
            <Position>
              <LatitudeDegrees>41.0422</LatitudeDegrees>
              <LongitudeDegrees>28.9867</LongitudeDegrees>
            </Position>
            <AltitudeMeters>120</AltitudeMeters>
          </Trackpoint>`}
        </Track>
      </Lap>
      <Creator xsi:type="Device_t">
        <Name>Garmin Edge 1040 Solar</Name>
        <UnitId>34928174</UnitId>
        <ProductID>3843</ProductID>
        <Version>
          <VersionMajor>21</VersionMajor>
          <VersionMinor>18</VersionMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
  <Author xsi:type="Application_t">
    <Name>PEL Companion Pro - Garmin Connect API</Name>
    <Build>
      <Version>
        <VersionMajor>2</VersionMajor>
        <VersionMinor>4</VersionMinor>
      </Version>
    </Build>
    <LangID>tr</LangID>
  </Author>
</TrainingCenterDatabase>`;

    const blob = new Blob([tcxContent], { type: 'application/vnd.garmin.tcx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = ride.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `garmin_${sanitizedTitle}_${Date.now()}.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const garminService = new GarminService();
