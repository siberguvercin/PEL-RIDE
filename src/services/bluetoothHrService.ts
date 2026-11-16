import { HeartRateSensorState, HrZoneDistribution } from '../types';
import { getCurrentZone, DEFAULT_MAX_HR } from '../utils/heartRate';

type HrListener = (state: HeartRateSensorState) => void;

class BluetoothHrService {
  private device: any = null;
  private hrCharacteristic: any = null;
  private batteryCharacteristic: any = null;
  private simulationInterval: any = null;
  private trackingInterval: any = null;

  private listeners: Set<HrListener> = new Set();

  private state: HeartRateSensorState = {
    isConnected: false,
    deviceName: null,
    batteryLevel: null,
    currentBpm: 0,
    avgBpm: 0,
    maxBpm: 0,
    isSimulated: false,
    sensorContact: true,
    maxHeartRateSetting: DEFAULT_MAX_HR
  };

  private bpmHistory: number[] = [];
  private zoneDistribution: HrZoneDistribution = {
    z1Sec: 0,
    z2Sec: 0,
    z3Sec: 0,
    z4Sec: 0,
    z5Sec: 0
  };

  constructor() {
    // Start interval to accumulate zone seconds whenever connected
    this.trackingInterval = setInterval(() => {
      if (this.state.isConnected && this.state.currentBpm > 40) {
        const zone = getCurrentZone(this.state.currentBpm, this.state.maxHeartRateSetting);
        if (zone.zone === 1) this.zoneDistribution.z1Sec += 1;
        else if (zone.zone === 2) this.zoneDistribution.z2Sec += 1;
        else if (zone.zone === 3) this.zoneDistribution.z3Sec += 1;
        else if (zone.zone === 4) this.zoneDistribution.z4Sec += 1;
        else if (zone.zone === 5) this.zoneDistribution.z5Sec += 1;
      }
    }, 1000);
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getState(): HeartRateSensorState {
    return { ...this.state };
  }

  public getZoneDistribution(): HrZoneDistribution {
    return { ...this.zoneDistribution };
  }

  public setMaxHeartRate(maxHr: number) {
    this.state.maxHeartRateSetting = Math.max(120, Math.min(230, maxHr));
    this.notify();
  }

  public subscribe(listener: HrListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(s);
      } catch (err) {
        console.error('HR listener error:', err);
      }
    });
  }

  public async connect(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth bu tarayıcıda desteklenmiyor. Lütfen Chrome / Edge kullanın veya Test Simülatörünü açın.');
    }

    try {
      // Disconnect simulation if active
      this.stopSimulation();

      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service', 'device_information']
      });

      this.device = device;
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnected();
      });

      const server = await device.gatt.connect();

      // Connect Heart Rate Service
      const hrService = await server.getPrimaryService('heart_rate');
      const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
      this.hrCharacteristic = hrChar;

      await hrChar.startNotifications();
      hrChar.addEventListener('characteristicvaluechanged', (e: any) => {
        this.parseHeartRateValue(e.target.value);
      });

      // Try reading Battery Level (optional service)
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batChar = await batteryService.getCharacteristic('battery_level');
        this.batteryCharacteristic = batChar;
        const val = await batChar.readValue();
        const level = val.getUint8(0);
        this.state.batteryLevel = level;
      } catch (batErr) {
        console.warn('Battery service not available on this HRM:', batErr);
        this.state.batteryLevel = null;
      }

      this.state.isConnected = true;
      this.state.deviceName = device.name || 'Bluetooth Nabız Bandı';
      this.state.isSimulated = false;
      this.notify();
      return true;
    } catch (err: any) {
      this.handleDisconnected();
      throw err;
    }
  }

  private parseHeartRateValue(value: DataView) {
    if (!value || value.byteLength === 0) return;

    const flags = value.getUint8(0);
    // Bit 0: 0 = uint8, 1 = uint16
    const is16Bit = (flags & 0x01) !== 0;
    // Bit 1 & 2: sensor contact
    const contactSupported = (flags & 0x04) !== 0;
    const contactDetected = (flags & 0x02) !== 0;

    let bpm = 0;
    if (is16Bit && value.byteLength >= 3) {
      bpm = value.getUint16(1, true);
    } else if (!is16Bit && value.byteLength >= 2) {
      bpm = value.getUint8(1);
    }

    if (bpm > 30 && bpm < 250) {
      this.updateBpm(bpm, contactSupported ? contactDetected : true);
    }
  }

  private updateBpm(bpm: number, contact: boolean = true) {
    this.bpmHistory.push(bpm);
    if (this.bpmHistory.length > 3600) this.bpmHistory.shift();

    const sum = this.bpmHistory.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / this.bpmHistory.length);
    const max = Math.max(...this.bpmHistory);

    this.state.currentBpm = bpm;
    this.state.avgBpm = avg;
    this.state.maxBpm = max;
    this.state.sensorContact = contact;
    this.notify();
  }

  public disconnect() {
    this.stopSimulation();
    if (this.device && this.device.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (_) {}
    }
    this.handleDisconnected();
  }

  private handleDisconnected() {
    this.state.isConnected = false;
    this.state.deviceName = null;
    this.state.currentBpm = 0;
    this.state.batteryLevel = null;
    this.state.isSimulated = false;
    this.hrCharacteristic = null;
    this.batteryCharacteristic = null;
    this.device = null;
    this.notify();
  }

  // --- DEMO / SIMULATOR MODE FOR TESTING & BROWSERS WITHOUT BLE ---
  public toggleSimulation(enable?: boolean): boolean {
    const shouldEnable = enable !== undefined ? enable : !this.state.isSimulated;

    if (!shouldEnable) {
      this.stopSimulation();
      this.handleDisconnected();
      return false;
    }

    // Start simulation
    this.disconnect();
    this.state.isConnected = true;
    this.state.deviceName = 'Peloton Pro Test HRM (BLE Sanal)';
    this.state.batteryLevel = 94;
    this.state.isSimulated = true;
    this.state.sensorContact = true;

    let baseHr = 138;
    let tick = 0;

    this.simulationInterval = setInterval(() => {
      tick++;
      // Realistic smooth heart rate oscillation (mimicking cycling efforts and climbs)
      const wave = Math.sin(tick / 5) * 14 + Math.sin(tick / 15) * 8;
      const jitter = (Math.random() - 0.5) * 3;
      const calculatedBpm = Math.round(Math.max(105, Math.min(182, baseHr + wave + jitter)));

      this.updateBpm(calculatedBpm, true);

      // Random slow battery drain simulation
      if (tick % 60 === 0 && this.state.batteryLevel && this.state.batteryLevel > 5) {
        this.state.batteryLevel -= 1;
      }
    }, 1000);

    this.notify();
    return true;
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public resetRideSession() {
    this.bpmHistory = [];
    this.zoneDistribution = {
      z1Sec: 0,
      z2Sec: 0,
      z3Sec: 0,
      z4Sec: 0,
      z5Sec: 0
    };
    this.state.avgBpm = this.state.currentBpm;
    this.state.maxBpm = this.state.currentBpm;
    this.notify();
  }
}

export const bluetoothHrService = new BluetoothHrService();
