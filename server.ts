import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { cleanProfanity } from './src/utils/profanityFilter.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY sunucu ortam değişkeni tanımlı değil.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '.pel_data');
const CHAT_STORE_PATH = path.join(DATA_DIR, 'chat_store.json');

const app = express();
const server = createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store for live rides, chats, and streams
interface StreamSession {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  category: string;
  startedAt: number;
  viewers: number;
  speed: number;
  altitude: number;
  distance: number;
  lat: number;
  lng: number;
  heartRate?: number;
  lastFrame?: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  recipientId?: string;
  recipientName?: string;
  isPrivate?: boolean;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  type: 'chat' | 'alert' | 'route_share' | 'system';
  timestamp: number;
  likes?: number;
}

interface OnlineUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  connectedAt: number;
  lastSeenAt: number;
  isOnline: boolean;
}

interface GroupRide {
  id: string;
  code: string;
  title: string;
  creatorName: string;
  creatorId: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  meetingPoint: string;
  lat: number;
  lng: number;
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: number;
}

interface CyclingEvent {
  id: string;
  title: string;
  category: 'Gran Fondo' | 'Kriteryum' | 'Gravel Yarışı' | 'Brevet' | 'Sosyal Tur';
  organizer: string;
  date: string;
  startTime: string;
  location: string;
  city: string;
  distanceKm: number;
  elevationM: number;
  registrationOpen: boolean;
  participantsCount: number;
  registeredUserIds: string[];
  description: string;
  lat: number;
  lng: number;
}

interface ActiveRider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  altitude: number;
  heartRate?: number;
  updatedAt: number;
}

interface LeaderboardRider {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  tier: string;
  divisionName: string;
  points: number;
  totalDistanceKm: number;
  totalClimbM: number;
  ftpWatts: number;
  wattsPerKg: number;
  ridesCount: number;
  isOnline: boolean;
  isLive: boolean;
}

const activeStreams = new Map<string, StreamSession>();
const activeRiders = new Map<string, ActiveRider>();

// Real Cycling Events
let cyclingEvents: CyclingEvent[] = [
  {
    id: 'event-granfondo-ist-2026',
    title: 'Gran Fondo Marmara & İstanbul Boğaz Etabı',
    category: 'Gran Fondo',
    organizer: 'Türkiye Bisiklet Federasyonu & PEL',
    date: '15 Kasım 2026',
    startTime: '08:00',
    location: 'Yenikapı Etkinlik Alanı - Rumeli Feneri',
    city: 'İstanbul',
    distanceKm: 98.4,
    elevationM: 1140,
    registrationOpen: true,
    participantsCount: 342,
    registeredUserIds: ['user-mert-01'],
    description: 'Boğaz sahil hattı ve Karadeniz fener tırmanışlarıyla sezonun en prestijli yol bisikleti yarışı.',
    lat: 41.002,
    lng: 28.952
  },
  {
    id: 'event-belgrad-crit-2026',
    title: 'Belgrad Ormanı Gece Kriteryumu (Gravel)',
    category: 'Kriteryum',
    organizer: 'Peloton Gravel Club',
    date: '22 Kasım 2026',
    startTime: '19:30',
    location: 'Neşetsuyu Tabiat Parkı',
    city: 'İstanbul',
    distanceKm: 42.0,
    elevationM: 620,
    registrationOpen: true,
    participantsCount: 118,
    registeredUserIds: [],
    description: 'Güçlü farlar eşliğinde orman parkurunda 6 turluk yüksek tempolu kapalı devre yarış.',
    lat: 41.178,
    lng: 28.986
  },
  {
    id: 'event-cesme-fondo-2026',
    title: 'Ege Rüzgarı Çeşme - Urla Gran Fondo',
    category: 'Gran Fondo',
    organizer: 'İzmir Velo Spor Kulübü',
    date: '06 Aralık 2026',
    startTime: '09:00',
    location: 'Çeşme Marina Meydanı',
    city: 'İzmir',
    distanceKm: 110.5,
    elevationM: 1350,
    registrationOpen: true,
    participantsCount: 285,
    registeredUserIds: [],
    description: 'Zeytinlikler, sert Ege rüzgarı ve dik kıyı tırmanışlarıyla dolu profesyonel yarış deneyimi.',
    lat: 38.323,
    lng: 26.304
  },
  {
    id: 'event-uludag-climb-2026',
    title: 'Uludağ Zirve Tırmanış Meydan Okuması',
    category: 'Brevet',
    organizer: 'Bursa Tırmanış Pelotonu',
    date: '13 Aralık 2026',
    startTime: '07:30',
    location: 'Tophane Meydanı - Uludağ Oteller Bölgesi',
    city: 'Bursa',
    distanceKm: 34.8,
    elevationM: 1820,
    registrationOpen: true,
    participantsCount: 96,
    registeredUserIds: [],
    description: '%8 ortalama eğimle 1820 metre irtifa kazanımı sunan Türkiye’nin en efsanevi dağ tırmanışı.',
    lat: 40.183,
    lng: 29.061
  }
];

// Real community leaderboard populated dynamically from authenticated riders (no fake NPCs)
const globalLeaderboard: LeaderboardRider[] = [];

// Real-time chat & known real users (persisted to disk across restarts)
const knownUsers = new Map<string, OnlineUser>();

const chatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    roomId: 'global',
    userId: 'user-pel-system',
    userName: 'PEL',
    text: '🚴 Peloton canlı sohbet odası hazır! Buradan gönderdiğiniz mesajlar bağlı tüm kullanıcılara anlık iletilir.',
    type: 'system',
    timestamp: Date.now() - 60000,
  }
];

function loadPersistedChatStore() {
  try {
    if (fs.existsSync(CHAT_STORE_PATH)) {
      const raw = fs.readFileSync(CHAT_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        chatMessages.length = 0;
        for (const m of parsed.messages.slice(-1000)) {
          if (m && m.id && m.roomId) chatMessages.push(m);
        }
      }
      if (Array.isArray(parsed.knownUsers)) {
        for (const u of parsed.knownUsers) {
          if (u && u.userId && u.userName) {
            knownUsers.set(u.userId, { ...u, isOnline: false });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[PEL Store] Could not load persisted chat store:', err);
  }
}

loadPersistedChatStore();

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSaveChatStore() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(
        CHAT_STORE_PATH,
        JSON.stringify({
          messages: chatMessages.slice(-1000),
          knownUsers: Array.from(knownUsers.values()).slice(-500),
        }),
        'utf-8'
      );
    } catch (err) {
      console.warn('[PEL Store] Save skipped:', err);
    }
  }, 400);
}

const groupRides: GroupRide[] = [
  {
    id: 'ride-belgrad-01',
    code: 'BEL77',
    title: 'Belgrad Ormanı Gravel & Trail Sürüşü',
    creatorName: 'Mert (Gravel King)',
    creatorId: 'user-mert-01',
    date: 'Cumartesi 07:30',
    distanceKm: 32.5,
    elevationM: 480,
    meetingPoint: 'Neşetsuyu Girişi, İstanbul',
    lat: 41.178,
    lng: 28.986,
    participants: 8,
    status: 'active',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'ride-bosphorus-02',
    code: 'BOS34',
    title: 'Boğaz Hattı Sabah Temposu',
    creatorName: 'Selin Aksoy',
    creatorId: 'user-selin-velo',
    date: 'Pazar 06:45',
    distanceKm: 45.0,
    elevationM: 190,
    meetingPoint: 'Beşiktaş İskele Meydanı',
    lat: 41.042,
    lng: 29.006,
    participants: 14,
    status: 'active',
    createdAt: Date.now() - 43200000,
  }
];

// WebSocket Setup
const wss = new WebSocketServer({ server, path: '/ws' });

interface WSClient {
  ws: WebSocket;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  connectedAt: number;
  activeRoom?: string;
  watchingStreamId?: string;
}

const clients = new Map<WebSocket, WSClient>();

function getOnlineUsers(): OnlineUser[] {
  const map = new Map<string, OnlineUser>();
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN && client.userId && client.userName) {
      map.set(client.userId, {
        userId: client.userId,
        userName: client.userName,
        userAvatar: client.userAvatar,
        connectedAt: client.connectedAt,
        lastSeenAt: Date.now(),
        isOnline: true
      });
    }
  }
  return Array.from(map.values());
}

function getAllDirectoryUsers(): OnlineUser[] {
  const onlineMap = new Map<string, OnlineUser>();
  for (const u of getOnlineUsers()) {
    onlineMap.set(u.userId, u);
  }
  const merged = new Map<string, OnlineUser>();
  for (const [id, u] of knownUsers.entries()) {
    merged.set(id, onlineMap.get(id) || { ...u, isOnline: false });
  }
  for (const [id, u] of onlineMap.entries()) {
    merged.set(id, u);
  }
  return Array.from(merged.values());
}

function sendToUser(targetUserId: string, data: object) {
  const payload = JSON.stringify(data);
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN && client.userId === targetUserId) {
      ws.send(payload);
    }
  }
}

function isDmRoomId(roomId: string): boolean {
  return roomId.startsWith('dm_') || roomId.startsWith('dm:');
}

function getDmParticipants(roomId: string, senderId?: string, recipientId?: string): string[] {
  const parts = new Set<string>();
  if (senderId) parts.add(senderId);
  if (recipientId) parts.add(recipientId);
  if (isDmRoomId(roomId)) {
    const raw = roomId.slice(3);
    const split = raw.split('__');
    for (const p of split) {
      if (p) parts.add(p);
    }
  }
  return Array.from(parts);
}

function isUserInDmMessage(m: ChatMessage, targetUserId?: string): boolean {
  if (!targetUserId) return false;
  if (m.userId === targetUserId || m.recipientId === targetUserId) return true;
  if (isDmRoomId(m.roomId)) {
    const participants = getDmParticipants(m.roomId, m.userId, m.recipientId);
    return participants.includes(targetUserId);
  }
  return false;
}

function broadcast(data: object, filter?: (client: WSClient) => boolean) {
  const payload = JSON.stringify(data);
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) {
        ws.send(payload);
      }
    }
  }
}

function dispatchChatMessage(newMsg: ChatMessage) {
  if (chatMessages.some((m) => m.id === newMsg.id)) {
    return;
  }
  chatMessages.push(newMsg);
  if (chatMessages.length > 1000) chatMessages.shift();
  scheduleSaveChatStore();

  if (newMsg.isPrivate || isDmRoomId(newMsg.roomId)) {
    const participants = getDmParticipants(newMsg.roomId, newMsg.userId, newMsg.recipientId);
    broadcast(
      {
        type: 'new_chat_message',
        message: newMsg
      },
      (c) => Boolean(c.userId && participants.includes(c.userId))
    );
  } else {
    broadcast({
      type: 'new_chat_message',
      message: newMsg
    });
  }
}

wss.on('connection', (ws) => {
  const client: WSClient = { ws, connectedAt: Date.now() };
  clients.set(ws, client);

  const publicRecentMessages = chatMessages
    .filter((m) => !m.isPrivate && !isDmRoomId(m.roomId))
    .slice(-100);

  // Send initial snapshot to newly connected client (public messages only)
  ws.send(JSON.stringify({
    type: 'init_sync',
    streams: Array.from(activeStreams.values()),
    riders: Array.from(activeRiders.values()),
    rides: groupRides,
    events: cyclingEvents,
    leaderboard: globalLeaderboard,
    recentMessages: publicRecentMessages,
    onlineUsers: getAllDirectoryUsers(),
    serverTime: Date.now()
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'set_user': {
          client.userId = msg.userId;
          client.userName = msg.userName;
          client.userAvatar = msg.userAvatar;

          if (client.userId && client.userName) {
            knownUsers.set(client.userId, {
              userId: client.userId,
              userName: client.userName,
              userAvatar: client.userAvatar,
              connectedAt: client.connectedAt,
              lastSeenAt: Date.now(),
              isOnline: true
            });
            scheduleSaveChatStore();
          }

          // Broadcast updated real users directory & online status to everyone
          broadcast({
            type: 'online_users_update',
            onlineUsers: getAllDirectoryUsers()
          });

          // Send this user's private DM history exclusively to them
          if (client.userId) {
            const myDms = chatMessages.filter(
              (m) => (m.isPrivate || isDmRoomId(m.roomId)) && isUserInDmMessage(m, client.userId)
            );
            ws.send(JSON.stringify({
              type: 'private_messages_sync',
              messages: myDms.slice(-200)
            }));
          }
          break;
        }

        case 'typing_status': {
          const roomId = String(msg.roomId || 'global');
          const payload = {
            type: 'typing_status',
            roomId,
            userId: client.userId || msg.userId,
            userName: client.userName || msg.userName || 'Bisikletçi',
            isTyping: Boolean(msg.isTyping)
          };
          if (isDmRoomId(roomId)) {
            const participants = getDmParticipants(roomId, client.userId);
            broadcast(
              payload,
              (c) => Boolean(c.userId && participants.includes(c.userId) && c.ws !== ws)
            );
          } else {
            broadcast(payload, (c) => c.ws !== ws);
          }
          break;
        }

        case 'chat_message': {
          const roomId = msg.roomId || 'global';
          const isPrivate = Boolean(msg.isPrivate || isDmRoomId(roomId));
          const newMsg: ChatMessage = {
            id: msg.id || ('msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
            roomId,
            userId: msg.userId || client.userId || 'anon',
            userName: msg.userName || client.userName || 'PEL Rider',
            userAvatar: msg.userAvatar || client.userAvatar,
            recipientId: msg.recipientId,
            recipientName: msg.recipientName,
            isPrivate,
            text: cleanProfanity(msg.text || ''),
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType,
            type: msg.msgType || 'chat',
            timestamp: Date.now(),
            likes: 0
          };
          dispatchChatMessage(newMsg);
          break;
        }

        case 'start_stream': {
          const stream: StreamSession = {
            id: msg.streamId || 'stream-' + Date.now(),
            streamerId: msg.userId || client.userId || 'streamer-' + Date.now(),
            streamerName: msg.userName || client.userName || 'PEL Rider',
            title: msg.title || 'Canlı Sürüş Yayını',
            category: msg.category || 'Road / Gravel',
            startedAt: Date.now(),
            viewers: 1,
            speed: msg.speed || 0,
            altitude: msg.altitude || 0,
            distance: msg.distance || 0,
            lat: msg.lat || 41.0082,
            lng: msg.lng || 28.9784,
          };
          activeStreams.set(stream.id, stream);
          client.watchingStreamId = stream.id;

          broadcast({
            type: 'stream_started',
            stream
          });
          break;
        }

        case 'stop_stream': {
          const streamId = msg.streamId;
          if (streamId && activeStreams.has(streamId)) {
            activeStreams.delete(streamId);
            broadcast({
              type: 'stream_ended',
              streamId
            });
          }
          break;
        }

        case 'join_stream': {
          const streamId = msg.streamId;
          client.watchingStreamId = streamId;
          const stream = activeStreams.get(streamId);
          if (stream) {
            stream.viewers = Array.from(clients.values()).filter(c => c.watchingStreamId === streamId).length;
            broadcast({
              type: 'stream_viewers_update',
              streamId,
              viewers: stream.viewers
            });
            ws.send(JSON.stringify({
              type: 'stream_sync',
              stream
            }));
            if (client.userId && client.userId !== stream.streamerId) {
              sendToUser(stream.streamerId, {
                type: 'stream_viewer_joined',
                streamId,
                viewerId: client.userId,
                viewerName: client.userName || 'İzleyici'
              });
            }
          }
          break;
        }

        case 'leave_stream': {
          const streamId = client.watchingStreamId;
          client.watchingStreamId = undefined;
          if (streamId && activeStreams.has(streamId)) {
            const stream = activeStreams.get(streamId)!;
            stream.viewers = Math.max(1, Array.from(clients.values()).filter(c => c.watchingStreamId === streamId).length);
            broadcast({
              type: 'stream_viewers_update',
              streamId,
              viewers: stream.viewers
            });
            if (client.userId && client.userId !== stream.streamerId) {
              sendToUser(stream.streamerId, {
                type: 'stream_viewer_left',
                streamId,
                viewerId: client.userId
              });
            }
          }
          break;
        }

        case 'webrtc_offer':
        case 'webrtc_answer':
        case 'webrtc_ice': {
          const { targetUserId, streamId } = msg;
          if (targetUserId) {
            sendToUser(targetUserId, {
              ...msg,
              fromUserId: client.userId,
              fromUserName: client.userName,
              streamId
            });
          }
          break;
        }

        case 'stream_telemetry': {
          const { streamId, speed, altitude, distance, lat, lng, heartRate } = msg;
          const stream = activeStreams.get(streamId);
          if (stream) {
            if (speed !== undefined) stream.speed = speed;
            if (altitude !== undefined) stream.altitude = altitude;
            if (distance !== undefined) stream.distance = distance;
            if (lat !== undefined) stream.lat = lat;
            if (lng !== undefined) stream.lng = lng;
            if (heartRate !== undefined) stream.heartRate = heartRate;

            broadcast({
              type: 'stream_telemetry_update',
              streamId,
              telemetry: { speed, altitude, distance, lat, lng, heartRate }
            }, c => c.watchingStreamId === streamId);
          }
          break;
        }

        case 'stream_relay_frame': {
          const { streamId, frame } = msg;
          const stream = activeStreams.get(streamId);
          if (stream) {
            stream.lastFrame = frame;
            broadcast({
              type: 'stream_relay_frame',
              streamId,
              frame
            }, c => c.watchingStreamId === streamId && c.ws !== ws);
          }
          break;
        }

        case 'stream_reaction': {
          const { streamId, emoji, userName } = msg;
          broadcast({
            type: 'stream_reaction',
            streamId,
            emoji: emoji || '🔥',
            userName: userName || client.userName || 'PEL Rider'
          }, c => c.watchingStreamId === streamId);
          break;
        }

        case 'rider_location': {
          const { riderId, name, lat, lng, speed, heading, altitude, heartRate } = msg;
          if (riderId && lat && lng) {
            const rider: ActiveRider = {
              id: riderId,
              name: name || 'PEL Rider',
              lat,
              lng,
              speed: speed || 0,
              heading: heading || 0,
              altitude: altitude || 0,
              heartRate: heartRate,
              updatedAt: Date.now()
            };
            activeRiders.set(riderId, rider);
            broadcast({
              type: 'rider_location_update',
              rider
            });
          }
          break;
        }

        case 'register_event': {
          const { eventId, userId } = msg;
          const target = cyclingEvents.find(e => e.id === eventId);
          if (target && userId) {
            if (!target.registeredUserIds.includes(userId)) {
              target.registeredUserIds.push(userId);
              target.participantsCount += 1;
              broadcast({
                type: 'event_updated',
                event: target
              });
            }
          }
          break;
        }

        case 'unregister_event': {
          const { eventId, userId } = msg;
          const target = cyclingEvents.find(e => e.id === eventId);
          if (target && userId) {
            target.registeredUserIds = target.registeredUserIds.filter(id => id !== userId);
            target.participantsCount = Math.max(0, target.participantsCount - 1);
            broadcast({
              type: 'event_updated',
              event: target
            });
          }
          break;
        }

        case 'peloton_radio_signal': {
          const { signalType, title, senderName, roomId } = msg;
          broadcast({
            type: 'peloton_radio_signal',
            signalType,
            title,
            senderName: senderName || client.userName || 'Peloton Rider',
            timestamp: Date.now()
          });
          break;
        }

        case 'emergency_sos_signal': {
          const { riderName, lat, lng, battery, message } = msg;
          broadcast({
            type: 'emergency_sos_alert',
            riderName: riderName || client.userName || 'Peloton Rider',
            lat,
            lng,
            battery,
            message,
            timestamp: Date.now()
          });
          break;
        }

        case 'create_event': {
          const newEvent: CyclingEvent = {
            id: 'event-' + Date.now(),
            title: msg.title || 'Yeni Bisiklet Etkinliği',
            category: msg.category || 'Gran Fondo',
            organizer: msg.organizer || client.userName || 'PEL Topluluğu',
            date: msg.date || 'Tarih Belirlenecek',
            startTime: msg.startTime || '09:00',
            location: msg.location || 'Buluşma Noktası',
            city: msg.city || 'İstanbul',
            distanceKm: msg.distanceKm || 50,
            elevationM: msg.elevationM || 400,
            registrationOpen: true,
            participantsCount: 1,
            registeredUserIds: client.userId ? [client.userId] : [],
            description: msg.description || 'Topluluk sürüş etkinliği.',
            lat: msg.lat || 41.0082,
            lng: msg.lng || 28.9784
          };
          cyclingEvents.unshift(newEvent);
          broadcast({
            type: 'event_created',
            event: newEvent
          });
          break;
        }

        case 'clear_events': {
          // Allows testing "etkinlik yok" state
          cyclingEvents = [];
          broadcast({
            type: 'events_cleared'
          });
          break;
        }

        case 'create_group_ride': {
          const ride: GroupRide = {
            id: 'ride-' + Date.now(),
            code: msg.code || Math.random().toString(36).substring(2, 7).toUpperCase(),
            title: msg.title || 'PEL Grup Sürüşü',
            creatorName: msg.creatorName || client.userName || 'PEL Rider',
            creatorId: msg.creatorId || client.userId || 'anon',
            date: msg.date || 'Bugün',
            distanceKm: msg.distanceKm || 25,
            elevationM: msg.elevationM || 150,
            meetingPoint: msg.meetingPoint || 'Buluşma Noktası',
            lat: msg.lat || 41.0082,
            lng: msg.lng || 28.9784,
            participants: 1,
            status: 'active',
            createdAt: Date.now()
          };
          groupRides.unshift(ride);
          broadcast({
            type: 'group_ride_created',
            ride
          });
          break;
        }

        case 'join_group_ride': {
          const { code, riderName } = msg;
          const target = groupRides.find(r => r.code?.toUpperCase() === code?.toUpperCase() || r.id === code);
          if (target) {
            target.participants += 1;
            broadcast({
              type: 'group_ride_updated',
              ride: target
            });
            ws.send(JSON.stringify({
              type: 'group_ride_joined_success',
              ride: target
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Grup sürüşü kodu bulunamadı.'
            }));
          }
          break;
        }
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });

  ws.on('close', () => {
    if (client.userId && knownUsers.has(client.userId)) {
      const existingUser = knownUsers.get(client.userId)!;
      knownUsers.set(client.userId, { ...existingUser, isOnline: false, lastSeenAt: Date.now() });
      scheduleSaveChatStore();
    }

    if (client.watchingStreamId) {
      const stream = activeStreams.get(client.watchingStreamId);
      if (stream) {
        if (stream.streamerId === client.userId) {
          const stillConnected = Array.from(clients.values()).some(
            (c) => c.ws !== ws && c.userId === stream.streamerId && c.ws.readyState === WebSocket.OPEN
          );
          if (!stillConnected) {
            activeStreams.delete(stream.id);
            broadcast({ type: 'stream_ended', streamId: stream.id });
          }
        } else {
          stream.viewers = Math.max(1, Array.from(clients.values()).filter(c => c.watchingStreamId === client.watchingStreamId && c.ws !== ws).length);
          broadcast({
            type: 'stream_viewers_update',
            streamId: client.watchingStreamId,
            viewers: stream.viewers
          });
          if (client.userId) {
            sendToUser(stream.streamerId, {
              type: 'stream_viewer_left',
              streamId: stream.id,
              viewerId: client.userId
            });
          }
        }
      }
    }
    clients.delete(ws);
    broadcast({
      type: 'online_users_update',
      onlineUsers: getAllDirectoryUsers()
    });
  });
});

// Periodic cleanup of stale riders (>5 mins inactivity)
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [id, r] of activeRiders.entries()) {
    if (r.updatedAt < cutoff) {
      activeRiders.delete(id);
      broadcast({ type: 'rider_removed', riderId: id });
    }
  }
}, 30000);

// API Routes
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    ok: true,
    activeStreamsCount: activeStreams.size,
    activeRidersCount: activeRiders.size,
    connectedClients: clients.size,
    eventsCount: cyclingEvents.length,
    time: Date.now()
  });
});

app.get('/api/events', (req: Request, res: Response) => {
  res.json(cyclingEvents);
});

app.post('/api/events', (req: Request, res: Response) => {
  const event = req.body;
  if (!event.id) event.id = 'event-' + Date.now();
  if (!event.registeredUserIds) event.registeredUserIds = [];
  cyclingEvents.unshift(event);
  broadcast({ type: 'event_created', event });
  res.json({ ok: true, event });
});

app.get('/api/leaderboard', (req: Request, res: Response) => {
  res.json(globalLeaderboard);
});

// Spotify API Integration (Client ID: eff4bf4dc4ce45d8b9cc17ccf0ea199d)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'eff4bf4dc4ce45d8b9cc17ccf0ea199d';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

interface SpotifyTrackItem {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumCover: string;
  durationFormatted: string;
  previewUrl: string;
  spotifyUrl: string;
  popularity: number;
  genres: string[];
}

const SPOTIFY_POPULAR_TRACKS: SpotifyTrackItem[] = [
  {
    id: '2XWjPtKdi2oSC95gCOOJyv',
    name: 'The Less I Know The Better',
    artist: 'Tame Impala',
    album: 'Currents',
    albumCover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:36',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    spotifyUrl: 'https://open.spotify.com/track/2XWjPtKdi2oSC95gCOOJyv',
    popularity: 92,
    genres: ['indie rock', 'psychedelic', 'cycling pump']
  },
  {
    id: '7D0r6v1Csp0Vz4v7iTq11l',
    name: 'Loser',
    artist: 'Beck',
    album: 'Mellow Gold',
    albumCover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:55',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-energetic-hip-hop-834.mp3',
    spotifyUrl: 'https://open.spotify.com/track/7D0r6v1Csp0Vz4v7iTq11l',
    popularity: 85,
    genres: ['alternative', '90s rock', 'sprint']
  },
  {
    id: '6XCOB0d8a9F0C0f5pZc4A1',
    name: 'Let It Happen',
    artist: 'Tame Impala',
    album: 'Currents',
    albumCover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '07:48',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
    spotifyUrl: 'https://open.spotify.com/track/6XCOB0d8a9F0C0f5pZc4A1',
    popularity: 88,
    genres: ['psychedelic', 'endurance', 'tempo']
  },
  {
    id: '017PF4Q3l4DBOW9vUwBpNI',
    name: 'Borderline',
    artist: 'Tame Impala',
    album: 'The Slow Rush',
    albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:57',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    spotifyUrl: 'https://open.spotify.com/track/017PF4Q3l4DBOW9vUwBpNI',
    popularity: 89,
    genres: ['neo-psychedelia', 'gravel', 'climbing']
  },
  {
    id: '5W3cjX2J3tjhG8theYzFRZ',
    name: 'Harder, Better, Faster, Stronger',
    artist: 'Daft Punk',
    album: 'Discovery',
    albumCover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:44',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
    spotifyUrl: 'https://open.spotify.com/track/5W3cjX2J3tjhG8theYzFRZ',
    popularity: 91,
    genres: ['electronic', 'french touch', 'wattage blast']
  },
  {
    id: '0VjIjW4GlUZAMYd2vXMi3b',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    albumCover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:20',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    popularity: 98,
    genres: ['synthpop', 'tempo ride', 'crit']
  },
  {
    id: '3n3Ppam7vgaVa1iaRUc9Lp',
    name: 'Mr. Brightside',
    artist: 'The Killers',
    album: 'Hot Fuss',
    albumCover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:42',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-energetic-hip-hop-834.mp3',
    spotifyUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
    popularity: 90,
    genres: ['indie rock', 'attack', 'breakaway']
  },
  {
    id: '6habFhsOp2NvshLv26DqMb',
    name: 'Desire',
    artist: 'Calvin Harris, Sam Smith',
    album: 'Desire',
    albumCover: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:00',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    spotifyUrl: 'https://open.spotify.com/track/6habFhsOp2NvshLv26DqMb',
    popularity: 87,
    genres: ['edm', 'cadence push', 'peloton pace']
  },
  {
    id: '4IadYkW1f5dfoYx5w3V87v',
    name: 'Do I Wanna Know?',
    artist: 'Arctic Monkeys',
    album: 'AM',
    albumCover: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '04:32',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
    spotifyUrl: 'https://open.spotify.com/track/4IadYkW1f5dfoYx5w3V87v',
    popularity: 94,
    genres: ['garage rock', 'descent', 'steep hill']
  },
  {
    id: '3tjFYV6RSFtuktYl3ZtYcq',
    name: "Don't Stop Me Now",
    artist: 'Queen',
    album: 'Jazz',
    albumCover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80',
    durationFormatted: '03:29',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
    spotifyUrl: 'https://open.spotify.com/track/3tjFYV6RSFtuktYl3ZtYcq',
    popularity: 91,
    genres: ['classic rock', 'max wattage', 'glory']
  }
];

let spotifyAccessToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyAppToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_SECRET) return null;
  if (spotifyAccessToken && spotifyAccessToken.expiresAt > Date.now()) {
    return spotifyAccessToken.token;
  }
  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (resp.ok) {
      const data = await resp.json();
      spotifyAccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000
      };
      return spotifyAccessToken.token;
    }
  } catch (err) {
    console.warn('[Spotify API] Client credentials auth fallback:', err);
  }
  return null;
}

app.get('/api/spotify/popular', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    clientId: SPOTIFY_CLIENT_ID,
    tracks: SPOTIFY_POPULAR_TRACKS
  });
});

app.get('/api/spotify/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  
  if (!query) {
    return res.json({
      ok: true,
      clientId: SPOTIFY_CLIENT_ID,
      tracks: SPOTIFY_POPULAR_TRACKS
    });
  }

  // 1. Live global music catalog search (Millions of tracks: Turkish pop/rock/rap, international hits, underground, etc.)
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=16`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'PelotonApp/1.0'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const liveTracks: SpotifyTrackItem[] = data.results.map((item: any) => {
          const durationMs = item.trackTimeMillis || 210000;
          const totalSec = Math.round(durationMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          const durationFormatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
          const albumCover = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80';
          const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(item.trackName + ' ' + item.artistName)}`;

          return {
            id: `track-${item.trackId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: item.trackName || query,
            artist: item.artistName || 'Sanatçı',
            album: item.collectionName || 'Albüm',
            albumCover,
            durationFormatted,
            previewUrl: item.previewUrl || 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
            spotifyUrl: spotifySearchUrl,
            popularity: 90,
            genres: [item.primaryGenreName?.toLowerCase() || 'pop', 'spotify']
          };
        });

        return res.json({
          ok: true,
          source: 'live_global_search',
          clientId: SPOTIFY_CLIENT_ID,
          tracks: liveTracks
        });
      }
    }
  } catch (err) {
    console.warn('[Music Search API] Live lookup failed, falling back to catalog:', err);
  }

  // 2. Fallback to catalog match
  const qLower = query.toLowerCase();
  const matched = SPOTIFY_POPULAR_TRACKS.filter((t) => {
    return (
      t.name.toLowerCase().includes(qLower) ||
      t.artist.toLowerCase().includes(qLower) ||
      t.album.toLowerCase().includes(qLower) ||
      t.genres.some((g) => g.toLowerCase().includes(qLower))
    );
  });

  if (matched.length > 0) {
    return res.json({
      ok: true,
      source: 'catalog_matched',
      clientId: SPOTIFY_CLIENT_ID,
      tracks: matched
    });
  }

  // 3. Fallback: custom dynamic Spotify track item matching the user search
  return res.json({
    ok: true,
    source: 'user_custom',
    clientId: SPOTIFY_CLIENT_ID,
    tracks: [
      {
        id: `custom-spotify-${Date.now()}`,
        name: query.charAt(0).toUpperCase() + query.slice(1),
        artist: 'Spotify Sanatçısı',
        album: 'Spotify Single',
        albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
        durationFormatted: '03:30',
        previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
        popularity: 88,
        genres: ['spotify search']
      },
      ...SPOTIFY_POPULAR_TRACKS.slice(0, 4)
    ]
  });
});

app.get('/api/streams', (req: Request, res: Response) => {
  res.json(Array.from(activeStreams.values()));
});

app.get('/api/users/online', (req: Request, res: Response) => {
  res.json({
    ok: true,
    onlineUsers: getAllDirectoryUsers()
  });
});

app.get('/api/dm/conversations/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.json([]);
  const myDms = chatMessages.filter(
    (m) => (m.isPrivate || isDmRoomId(m.roomId)) && isUserInDmMessage(m, userId)
  );
  res.json(myDms.slice(-200));
});

app.get('/api/chat/:roomId', (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const requesterId = (req.query.userId as string) || '';

  if (isDmRoomId(roomId)) {
    const participants = getDmParticipants(roomId);
    if (!requesterId || !participants.includes(requesterId)) {
      return res.status(403).json({ error: 'Bu özel sohbete erişim yetkiniz yok.' });
    }
    const filteredDm = chatMessages.filter((m) => m.roomId === roomId);
    return res.json(filteredDm.slice(-150));
  }

  const filtered = chatMessages.filter((m) => {
    if (m.isPrivate || isDmRoomId(m.roomId)) {
      return requesterId ? isUserInDmMessage(m, requesterId) && roomId === 'all' : false;
    }
    return roomId === 'all' || m.roomId === roomId;
  });
  res.json(filtered.slice(-150));
});

app.post('/api/chat', (req: Request, res: Response) => {
  const { id, roomId, userId, userName, userAvatar, recipientId, recipientName, isPrivate, text, mediaUrl, mediaType, type } = req.body;
  const targetRoom = roomId || 'global';
  const privateFlag = Boolean(isPrivate || isDmRoomId(targetRoom));
  const sanitizedText = cleanProfanity(text || '');
  const msg: ChatMessage = {
    id: id || ('msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
    roomId: targetRoom,
    userId: userId || 'anon',
    userName: userName || 'PEL Rider',
    userAvatar,
    recipientId,
    recipientName,
    isPrivate: privateFlag,
    text: sanitizedText,
    mediaUrl,
    mediaType,
    type: type || 'chat',
    timestamp: Date.now(),
    likes: 0
  };
  dispatchChatMessage(msg);

  res.json({ ok: true, message: msg });
});

app.get('/api/rides', (req: Request, res: Response) => {
  res.json(groupRides);
});

// AI-Generated Ride Insights Endpoint (Powered by @google/genai gemini-4-hydrogen)
app.post('/api/ai/ride-insights', async (req: Request, res: Response) => {
  try {
    const { ride, riderFtp = 245, riderWeightKg = 70, notes } = req.body;

    if (!ride) {
      return res.status(400).json({ error: 'Sürüş verisi eksik.' });
    }

    const durationSec = Math.max(1, ride.durationSec || 1);
    const distanceKm = ride.distanceKm || 0;
    const climbM = ride.climbM || 0;
    const avgSpeedKmH = ride.avgSpeedKmH || (distanceKm / (durationSec / 3600));
    const maxSpeedKmH = ride.maxSpeedKmH || (avgSpeedKmH * 1.35);
    const avgHeartRate = ride.avgHeartRate || 145;
    const maxHeartRate = ride.maxHeartRate || 175;

    // Biomechanical cycling physics estimations
    const totalMass = riderWeightKg + 9;
    const climbWorkJ = totalMass * 9.81 * climbM;
    const climbWatts = durationSec > 0 ? climbWorkJ / durationSec : 0;
    const rollingWatts = totalMass * 9.81 * 0.005 * (avgSpeedKmH / 3.6);
    const aeroWatts = 0.5 * 1.225 * 0.32 * Math.pow(avgSpeedKmH / 3.6, 3);
    const baselineWatts = Math.max(80, Math.round(climbWatts + rollingWatts + aeroWatts));

    const variability = climbM > distanceKm * 10 ? 1.15 : 1.08;
    const normalizedPower = Math.round(baselineWatts * variability);
    const intensityFactor = parseFloat((normalizedPower / riderFtp).toFixed(2));
    const trainingStressScore = Math.round(
      ((durationSec * normalizedPower * intensityFactor) / (riderFtp * 3600)) * 100
    );
    const wattsPerKg = parseFloat((normalizedPower / riderWeightKg).toFixed(2));

    const z1Max = Math.round(riderFtp * 0.55);
    const z2Max = Math.round(riderFtp * 0.75);
    const z3Max = Math.round(riderFtp * 0.90);
    const z4Max = Math.round(riderFtp * 1.05);
    const z5Max = Math.round(riderFtp * 1.20);
    const z6Max = Math.round(riderFtp * 1.50);

    const climbDensity = climbM / Math.max(1, distanceKm);
    let pZ1 = 0.15, pZ2 = 0.45, pZ3 = 0.22, pZ4 = 0.11, pZ5 = 0.05, pZ6 = 0.015, pZ7 = 0.005;
    if (climbDensity > 15) {
      pZ1 = 0.10; pZ2 = 0.30; pZ3 = 0.25; pZ4 = 0.20; pZ5 = 0.10; pZ6 = 0.035; pZ7 = 0.015;
    } else if (avgSpeedKmH > 32) {
      pZ1 = 0.10; pZ2 = 0.40; pZ3 = 0.35; pZ4 = 0.10; pZ5 = 0.03; pZ6 = 0.015; pZ7 = 0.005;
    }

    const powerZones = [
      { zone: 1, name: 'Z1 Aktif Toparlanma', rangeWatts: `< ${z1Max}W`, rangePct: '<55%', seconds: Math.round(durationSec * pZ1), percent: Math.round(pZ1 * 100), color: '#9CA3AF', adaptation: 'Toparlanma, laktat temizliği ve kan dolaşımı' },
      { zone: 2, name: 'Z2 Dayanıklılık (Aerobik Temel)', rangeWatts: `${z1Max + 1} - ${z2Max}W`, rangePct: '56-75%', seconds: Math.round(durationSec * pZ2), percent: Math.round(pZ2 * 100), color: '#10B981', adaptation: 'Mitokondriyal yoğunluk ve yağ oksidasyonu kapasitesi' },
      { zone: 3, name: 'Z3 Tempo (Peloton Hızı)', rangeWatts: `${z2Max + 1} - ${z3Max}W`, rangePct: '76-90%', seconds: Math.round(durationSec * pZ3), percent: Math.round(pZ3 * 100), color: '#3B82F6', adaptation: 'Aerobik güç, peloton temposu ve kas glikojeni kullanımı' },
      { zone: 4, name: 'Z4 Laktat Eşiği (FTP & SweetSpot)', rangeWatts: `${z3Max + 1} - ${z4Max}W`, rangePct: '91-105%', seconds: Math.round(durationSec * pZ4), percent: Math.round(pZ4 * 100), color: '#F59E0B', adaptation: 'Laktat birikme eşiğini yükseltme ve zamana karşı dayanıklılık' },
      { zone: 5, name: 'Z5 VO2 Max (Zirve Oksijen)', rangeWatts: `${z4Max + 1} - ${z5Max}W`, rangePct: '106-120%', seconds: Math.round(durationSec * pZ5), percent: Math.round(pZ5 * 100), color: '#FC4C02', adaptation: 'Kardiyovasküler tavan kapasitesi ve dik rampa atakları' },
      { zone: 6, name: 'Z6 Anaerobik Kapasite', rangeWatts: `${z5Max + 1} - ${z6Max}W`, rangePct: '121-150%', seconds: Math.round(durationSec * pZ6), percent: Math.round(pZ6 * 100), color: '#DC2626', adaptation: 'Yüksek glikolitik güç ve kaçış atakları' },
      { zone: 7, name: 'Z7 Nöromüsküler Güç (Sprint)', rangeWatts: `> ${z6Max}W`, rangePct: '>150%', seconds: Math.round(durationSec * pZ7), percent: Math.round(pZ7 * 100), color: '#7C3AED', adaptation: 'Maksimum motor ünite katılımı ve bitiş çizgisi sprinti' }
    ];

    const estimatedAvgCadence = Math.round(86 + (avgSpeedKmH > 30 ? 4 : -2) + (climbDensity > 12 ? -5 : 2));
    const grindingPct = climbDensity > 14 ? 22 : 8;
    const spinningPct = avgSpeedKmH > 32 ? 18 : 10;
    const optimalPct = Math.max(0, 100 - grindingPct - spinningPct);
    const gearScore = Math.min(96, Math.max(68, Math.round(optimalPct * 0.95 + 10)));
    const torqueStatus = grindingPct > 20 ? 'Yüksek Tork (Diz Yükü)' : (spinningPct > 25 ? 'Aşırı Yüksek Kadans' : 'Optimal Akıcı');

    const gearEfficiency = {
      score: gearScore,
      optimalCadenceRange: '84 - 94 RPM',
      estimatedAvgCadence,
      grindingPct,
      spinningPct,
      optimalPct,
      torqueStatus,
      chainCrossWarning: climbDensity > 18 && grindingPct > 15,
      recommendedGearing: climbDensity > 15 ? '50/34T Kompakt Aynakol & 11-32T / 11-34T Ruble' : '52/36T Yarı-Kompakt & 11-30T Ruble',
      summary: `Kadans dağılımınızın %${optimalPct}'si optimal verimlilik penceresinde kaydedildi.`
    };

    const carbsGrams = Math.round(distanceKm * 2.2 + climbM * 0.08);
    const proteinGrams = Math.round(riderWeightKg * 0.35 + (durationSec > 7200 ? 10 : 0));
    const hydrationLiters = parseFloat(((durationSec / 3600) * 0.65 + (climbM / 1000) * 0.2).toFixed(1));
    const recoveryHours = Math.round(Math.min(48, Math.max(12, (trainingStressScore / 10) * 2.8)));

    const sanitizedTitle = cleanProfanity(ride.title || 'Bisiklet Sürüşü');
    const sanitizedNotes = notes ? cleanProfanity(notes) : '';

    let aiSummary = `${distanceKm} km ve +${climbM}m tırmanış içeren bu sürüşte ${normalizedPower}W normalize güç ile dengeli bir aerobik temel çalışması gerçekleştirdiniz.`;
    let strengths = [
      `Hedef FTP'nize (${riderFtp}W) göre %${Math.round(intensityFactor * 100)} yoğunluk faktörü (IF) ile enerji depoları dengeli yönetildi.`,
      `Z2 ve Z3 bölgelerinde geçirilen süre aerobik dayanıklılık için verimli bir kazanım sağladı.`,
      `Ortalama ${estimatedAvgCadence} RPM pedal devri ile eklem yükü dengelendi.`
    ];
    let improvements = [
      climbDensity > 12 ? 'Eğim %7 üzerine çıktığında vitesi 1 diş daha hafifleterek kadansı 80 RPM üzerinde tutmaya özen gösterin.' : 'Düz etaplarda aero tutuş süresini artırarak rüzgar direncinden güç tasarrufu sağlayabilirsiniz.',
      `Yaklaşık ${trainingStressScore} TSS yükü sonrasında glikojen yenilenmesi için ${carbsGrams}g karbonhidrat tüketimi planlayın.`
    ];

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();
        const prompt = `Sen WorldTour seviyesinde profesyonel bir bisiklet performansı, telemetri ve biyomekanik antrenörüsün.
Aşağıdaki sporcu sürüş telemetrisini incele ve Türk sporcuya özel net, motive edici ve teknik bir sürüş analizi (Ride Insights) üret.

Sporcu & Sürüş Verileri:
- Aktivite Başlığı: ${sanitizedTitle}
- Sporcu FTP: ${riderFtp}W | Kilo: ${riderWeightKg}kg
- Mesafe: ${distanceKm} km | Süre: ${Math.round(durationSec / 60)} dakika
- Ortalama Hız: ${avgSpeedKmH} km/s | Maks Hız: ${maxSpeedKmH} km/s
- Toplam Tırmanış: +${climbM} m
- Ortalama Nabız: ${avgHeartRate} BPM | Maks Nabız: ${maxHeartRate} BPM
- Tahmini Normalize Güç (NP): ${normalizedPower} W (${wattsPerKg} W/kg)
- Yoğunluk Faktörü (IF): ${intensityFactor} | Antrenman Stres Puanı (TSS): ${trainingStressScore}
- Kadans / Vites Verimlilik Skoru: %${gearScore} (Tahmini kadans: ${estimatedAvgCadence} RPM)
${sanitizedNotes ? `- Sporcunun Sürüş Notları: ${sanitizedNotes}` : ''}

Yanıtını SADECE geçerli bir JSON objesi olarak şu yapıda ver:
{
  "aiSummary": "2-3 cümlelik derin ve profesyonel antrenör özeti",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
  "improvements": ["Gelişim tavsiyesi 1", "Gelişim tavsiyesi 2"],
  "recoveryHours": ${recoveryHours},
  "gearAdvice": "Vites ve kadans verimliliği hakkında teknik tavsiye"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed.aiSummary) aiSummary = parsed.aiSummary;
          if (Array.isArray(parsed.strengths) && parsed.strengths.length > 0) strengths = parsed.strengths;
          if (Array.isArray(parsed.improvements) && parsed.improvements.length > 0) improvements = parsed.improvements;
          if (parsed.gearAdvice) gearEfficiency.summary = parsed.gearAdvice;
        }
      } catch (aiErr) {
        console.warn('[Gemini AI Ride Insights] Fallback to biomechanics engine:', aiErr);
      }
    }

    const insightsData = {
      rideId: ride.id,
      title: sanitizedTitle,
      aiSummary,
      strengths,
      improvements,
      normalizedPower,
      intensityFactor,
      trainingStressScore,
      estimatedWattsPerKg: wattsPerKg,
      recoveryHours,
      nutritionAdvice: {
        carbsGrams,
        proteinGrams,
        hydrationLiters
      },
      powerZones,
      gearEfficiency,
      generatedAt: Date.now()
    };

    res.json({ ok: true, insights: insightsData });
  } catch (err: any) {
    console.error('Error generating ride insights:', err);
    res.status(500).json({ error: 'Sürüş analizi oluşturulurken hata meydana geldi.' });
  }
});

function buildAssistantSystemInstruction(riderContext: any = {}): string {
  const userName = riderContext.userName || 'Sporcu';
  const ftpWatts = Number(riderContext.ftpWatts) || 220;
  const weightKg = Number(riderContext.weightKg) || 72;
  const wattsPerKg = (ftpWatts / Math.max(30, weightKg)).toFixed(2);
  const recentRides = Array.isArray(riderContext.recentRides) ? riderContext.recentRides.slice(0, 12) : [];
  const weeklyKm = Number(riderContext.weeklyKm ?? 0).toFixed(1);
  const totalKm = Number(riderContext.totalKm ?? 0).toFixed(1);
  const totalClimb = Math.round(Number(riderContext.totalClimbM ?? 0));
  const ridesCount = Number(riderContext.ridesCount ?? recentRides.length);

  const weatherLine = riderContext.weather
    ? `Anlık Hava (${riderContext.weather.condition || 'Açık'}): ${riderContext.weather.temperature}°C, Hissedilen ${riderContext.weather.apparentTemperature}°C, Rüzgar ${riderContext.weather.windSpeed} km/s (${riderContext.weather.windDirectionLabel || ''}), Nem %${riderContext.weather.humidity}, Sürüş Uygunluk Puanı ${riderContext.weather.rideScore}/100.`
    : 'Anlık hava durumu verisi henüz alınmadı.';

  const liveLine = riderContext.liveTelemetry
    ? `Anlık Canlı Telemetri: Hız ${Number(riderContext.liveTelemetry.speed || 0).toFixed(1)} km/s, İrtifa ${Math.round(Number(riderContext.liveTelemetry.altitude || 0))}m${riderContext.liveTelemetry.heartRate ? `, Nabız ${riderContext.liveTelemetry.heartRate} BPM` : ''}${riderContext.liveTelemetry.lat ? `, Konum (${Number(riderContext.liveTelemetry.lat).toFixed(4)}, ${Number(riderContext.liveTelemetry.lng).toFixed(4)})` : ''}.`
    : '';

  const ridesText =
    recentRides.length > 0
      ? recentRides
          .map(
            (r: any, idx: number) =>
              `${idx + 1}. "${r.title}" (${String(r.date || '').slice(0, 10)}): ${Number(r.distanceKm || 0).toFixed(1)} km, ${Math.round(Number(r.durationSec || 0) / 60)} dk, Ort. ${Number(r.avgSpeedKmH || 0).toFixed(1)} km/s, +${Math.round(Number(r.climbM || 0))}m tırmanış`
          )
          .join('\n')
      : 'Kullanıcının henüz kaydedilmiş GPS sürüşü bulunmuyor.';

  return `Sen PEL uygulamasının WorldTour düzeyindeki kişisel bisiklet performans koçu ve spor bilimcisisin.
Görevin Türk bisikletçilere kendi gerçek telemetri verilerine, hava koşullarına ve sürüş geçmişine dayanarak pratik, bilimsel ve net rehberlik sunmaktır.

KURALLAR:
- Yanıtlarını Türkçe, doğrudan ve profesyonel bir antrenör diliyle ver; kesinlikle "yapay zeka", "Gemini", "dil modeli" gibi ifadeler veya "Harika soru!" gibi kalıp giriş cümleleri kullanma.
- Okunabilirliği yüksek tut: aşırı uzun yazma (genelde 100-220 kelime), **kalın yıldız** yerine temiz sade metin ve kısa madde işaretleri (•) kullan.
- KESİNLİKLE kullanıcıya ait olmayan sahte sürüş, uydurma mesafe veya sahte geçmiş veri üretme. Sürüş kaydı yoksa bunu dürüstçe belirt ve ilk sürüşü başlatması için öneride bulun.
- Kullanıcının FTP, W/kg, son 7 günlük mesafe ve hava/rüzgar verilerini doğrudan tavsiyelerine entegre et.

KULLANICININ GERÇEK VERİLERİ:
- Sporcu: ${userName}
- FTP: ${ftpWatts} W | Ağırlık: ${weightKg} kg (${wattsPerKg} W/kg)
- Son 7 Gün Mesafesi: ${weeklyKm} km
- Toplam Kayıtlı: ${ridesCount} sürüş · ${totalKm} km · +${totalClimb}m tırmanış
- ${weatherLine}
${liveLine ? `- ${liveLine}` : ''}
- Son Kayıtlı Sürüşler:
${ridesText}`;
}

// Gemini AI Cycling Assistant (Streaming SSE endpoint powered by gemini-4-hydrogen)
app.post('/api/ai/assistant/stream', async (req: Request, res: Response) => {
  try {
    const { message, history = [], riderContext = {} } = req.body || {};
    const trimmed = String(message || '').trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Lütfen asistan için bir soru veya mesaj yazın.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = buildAssistantSystemInstruction(riderContext);

    const normalizedHistory = Array.isArray(history)
      ? history
          .filter((h: any) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string' && h.text.trim())
          .slice(-16)
          .map((h: any) => ({
            role: h.role as 'user' | 'model',
            parts: [{ text: String(h.text) }],
          }))
      : [];

    const chat = ai.chats.create({
      model: 'gemini-4-hydrogen',
      history: normalizedHistory,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const stream = await chat.sendMessageStream({ message: trimmed });
    for await (const chunk of stream) {
      const textPart = chunk.text || '';
      if (textPart) {
        res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[Gemini AI Assistant Stream Error]:', err);
    const errMsg = err?.message || 'Gemini AI yanıtı oluşturulurken bir hata oluştu.';
    if (!res.headersSent) {
      res.status(err?.status || 500).json({ error: errMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    }
  }
});

// Gemini AI Cycling Assistant (Standard JSON endpoint powered by gemini-4-hydrogen)
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  try {
    const { message, history = [], riderContext = {} } = req.body || {};
    const trimmed = String(message || '').trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Lütfen asistan için bir soru veya mesaj yazın.' });
    }

    const ai = getGeminiClient();
    const systemInstruction = buildAssistantSystemInstruction(riderContext);

    const normalizedHistory = Array.isArray(history)
      ? history
          .filter((h: any) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string' && h.text.trim())
          .slice(-16)
          .map((h: any) => ({
            role: h.role as 'user' | 'model',
            parts: [{ text: String(h.text) }],
          }))
      : [];

    const chat = ai.chats.create({
      model: 'gemini-4-hydrogen',
      history: normalizedHistory,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const response = await chat.sendMessage({ message: trimmed });
    res.json({ ok: true, model: 'gemini-4-hydrogen', reply: response.text || '' });
  } catch (err: any) {
    console.error('[Gemini AI Assistant Error]:', err);
    res.status(err?.status || 500).json({
      error: err?.message || 'Gemini AI asistanı şu anda yanıt veremedi.',
    });
  }
});

// --- REAL NEARBY CYCLING ROUTES ENGINE ---

function decodeGooglePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function bearingDeg(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function cardinalTr(deg: number): string {
  const dirs = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

function samplePath<T>(arr: T[], maxCount: number): T[] {
  if (arr.length <= maxCount) return arr;
  const out: T[] = [];
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.min(arr.length - 1, Math.round((i / (maxCount - 1)) * (arr.length - 1)));
    out.push(arr[idx]);
  }
  return out;
}

const nearbyRoutesCache = new Map<string, { routes: any[]; source: string; betaNotice?: string; expiresAt: number }>();

async function fetchElevationsForPath(
  points: Array<{ lat: number; lng: number }>,
  mapsApiKey: string,
  preferGoogle: boolean
): Promise<number[]> {
  const sampled = samplePath(points, 20);
  if (sampled.length < 2) return sampled.map(() => 0);

  if (preferGoogle && mapsApiKey) {
    try {
      const pathStr = sampled.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
      const params = new URLSearchParams({
        path: pathStr,
        samples: String(sampled.length),
        key: mapsApiKey,
        solution_id: 'gmp_mcp_codeassist_v1_aistudio',
      });
      const resp = await fetch(`https://maps.googleapis.com/maps/api/elevation/json?${params.toString()}`, {
        headers: { 'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio' },
        signal: AbortSignal.timeout(5000),
      });
      const json: any = await resp.json();
      if (json.status === 'OK' && Array.isArray(json.results) && json.results.length > 0) {
        return json.results.map((r: any) => Math.round(Number(r.elevation) || 0));
      }
    } catch (_) {}
  }

  try {
    const lats = sampled.map((p) => p.lat.toFixed(5)).join(',');
    const lngs = sampled.map((p) => p.lng.toFixed(5)).join(',');
    const resp = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const json: any = await resp.json();
      if (Array.isArray(json.elevation)) {
        return json.elevation.map((e: any) => Math.round(Number(e) || 0));
      }
    }
  } catch (_) {}

  return sampled.map(() => 15);
}

function buildElevationStats(
  sampledPoints: Array<{ lat: number; lng: number }>,
  elevations: number[],
  totalDistKm: number
) {
  let climbM = 0;
  let descentM = 0;
  let maxGradientPct = 0;
  let rampCount = 0;
  let currentClimbRunM = 0;
  const profile: Array<{ distKm: number; elevM: number; gradientPct: number }> = [];

  for (let i = 0; i < sampledPoints.length; i++) {
    const elev = elevations[i] ?? elevations[elevations.length - 1] ?? 0;
    const distKm = Number(((i / Math.max(1, sampledPoints.length - 1)) * totalDistKm).toFixed(2));
    let grad = 0;
    if (i > 0) {
      const prevElev = elevations[i - 1] ?? elev;
      const segM = Math.max(50, haversineMeters(sampledPoints[i - 1], sampledPoints[i]));
      const delta = elev - prevElev;
      if (delta > 0) {
        climbM += delta;
        currentClimbRunM += delta;
      } else {
        if (currentClimbRunM >= 12) rampCount += 1;
        currentClimbRunM = 0;
        descentM += Math.abs(delta);
      }
      grad = Number(((delta / segM) * 100).toFixed(1));
      if (Math.abs(grad) > maxGradientPct) {
        maxGradientPct = Math.min(18, Math.abs(grad));
      }
    }
    profile.push({ distKm, elevM: elev, gradientPct: grad });
  }
  if (currentClimbRunM >= 12) rampCount += 1;

  const avgGradientPct = totalDistKm > 0 ? Number(((climbM / (totalDistKm * 1000)) * 100).toFixed(1)) : 0;
  return {
    climbM: Math.round(climbM),
    descentM: Math.round(descentM),
    avgGradientPct,
    maxGradientPct: Number(maxGradientPct.toFixed(1)),
    rampCount,
    elevationProfile: profile,
  };
}

app.get('/api/routes/geocode', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Konum arama metni gerekli.' });

    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const resp = await fetch(nomUrl, {
      headers: { 'User-Agent': 'PEL-Cycling-Platform/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!resp.ok) {
      return res.status(502).json({ error: 'Konum arama servisi yanıt vermedi.' });
    }
    const items: any = await resp.json();
    const results = (Array.isArray(items) ? items : []).map((it: any) => ({
      name: String(it.display_name || q),
      lat: parseFloat(it.lat),
      lng: parseFloat(it.lon),
    })).filter((r: any) => !isNaN(r.lat) && !isNaN(r.lng));

    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Konum arama hatası.' });
  }
});

app.post('/api/routes/nearby', async (req: Request, res: Response) => {
  try {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const rawTargetDist = Number(req.body?.targetDistanceKm);
    const targetDistanceKm = Number.isFinite(rawTargetDist) && rawTargetDist >= 5
      ? Math.min(120, Math.max(5, Math.round(rawTargetDist)))
      : 25;
    const requestedDifficultyRaw = String(req.body?.difficulty || 'all').trim();
    const requestedDifficulty = ['Kolay', 'Orta', 'Zor'].includes(requestedDifficultyRaw)
      ? requestedDifficultyRaw
      : 'all';

    const derivedRadiusKm = rawTargetDist
      ? Math.min(45, Math.max(5, Math.round(targetDistanceKm / 2.05)))
      : Math.min(40, Math.max(5, Number(req.body?.radiusKm) || 18));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Geçerli enlem ve boylam koordinatları gerekli.' });
    }

    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${derivedRadiusKm}_${targetDistanceKm}_${requestedDifficulty}`;
    const cached = nearbyRoutesCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        ok: true,
        cached: true,
        source: cached.source,
        betaNotice: cached.betaNotice,
        routes: cached.routes,
      });
    }

    const mapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    const origin = { lat, lng };

    type CandidateSpot = {
      id: string;
      name: string;
      lat: number;
      lng: number;
      category: 'Road' | 'Gravel' | 'MTB' | 'Coastal' | 'Climb';
      surface: string;
      address?: string;
      googleMapsUri?: string;
      source: 'google_maps' | 'openstreetmap';
    };

    const candidates: CandidateSpot[] = [];
    let usedGooglePlaces = false;

    const includedTypes =
      requestedDifficulty === 'Zor'
        ? ['hiking_area', 'national_park', 'park', 'tourist_attraction']
        : requestedDifficulty === 'Kolay'
        ? ['park', 'marina', 'sports_complex']
        : ['park', 'national_park', 'hiking_area', 'marina', 'tourist_attraction', 'sports_complex'];

    // 1. Try Google Places API (New) Nearby Search via server proxy (CF1-safe)
    if (mapsApiKey) {
      try {
        const placesResp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsApiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.primaryType,places.shortFormattedAddress,places.googleMapsUri',
            'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
          },
          body: JSON.stringify({
            includedTypes,
            maxResultCount: 18,
            rankPreference: targetDistanceKm >= 30 ? 'POPULARITY' : 'DISTANCE',
            languageCode: 'tr',
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: Math.min(50000, derivedRadiusKm * 1000),
              },
            },
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (placesResp.ok) {
          const placesJson: any = await placesResp.json();
          const list = Array.isArray(placesJson.places) ? placesJson.places : [];
          for (const p of list) {
            const pLat = p?.location?.latitude;
            const pLng = p?.location?.longitude;
            const pName = p?.displayName?.text;
            if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || !pName) continue;
            const distM = haversineMeters(origin, { lat: pLat, lng: pLng });
            if (distM < 1200) continue;

            const pType = String(p.primaryType || '').toLowerCase();
            let category: CandidateSpot['category'] = 'Road';
            let surface = 'Şehir & Çevre Asfaltı';
            if (pType.includes('hiking') || pType.includes('national_park')) {
              category = 'Gravel';
              surface = 'Park Yolu & Sıkıştırılmış Toprak';
            } else if (pType.includes('marina')) {
              category = 'Coastal';
              surface = 'Sahil Yolu & Bisiklet Şeridi';
            } else if (pType.includes('park')) {
              category = 'Road';
              surface = 'Park Çevresi Asfalt & Bisiklet Yolu';
            }

            candidates.push({
              id: `gmp-${p.id}`,
              name: pName,
              lat: pLat,
              lng: pLng,
              category,
              surface,
              address: p.shortFormattedAddress || '',
              googleMapsUri: p.googleMapsUri || '',
              source: 'google_maps',
            });
          }
          if (candidates.length > 0) usedGooglePlaces = true;
        }
      } catch (_) {}
    }

    // 2. Fallback to Real OpenStreetMap Overpass API POIs if Google Places API returned 0
    if (candidates.length === 0) {
      try {
        const radM = Math.min(35000, derivedRadiusKm * 1000);
        const query = `[out:json][timeout:10];(
          node["leisure"~"park|marina|nature_reserve"]["name"](around:${radM},${lat},${lng});
          way["leisure"~"park|nature_reserve"]["name"](around:${radM},${lat},${lng});
          node["natural"~"peak|beach|bay"]["name"](around:${radM},${lat},${lng});
          node["tourism"~"viewpoint"]["name"](around:${radM},${lat},${lng});
        );out center 24;`;

        const overResp = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(9000),
        });
        if (overResp.ok) {
          const overJson: any = await overResp.json();
          const els = Array.isArray(overJson.elements) ? overJson.elements : [];
          for (const el of els) {
            const pLat = el.lat ?? el.center?.lat;
            const pLng = el.lon ?? el.center?.lon;
            const pName = el.tags?.name;
            if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || !pName) continue;
            const distM = haversineMeters(origin, { lat: pLat, lng: pLng });
            if (distM < 1200) continue;

            const tags = el.tags || {};
            let category: CandidateSpot['category'] = 'Road';
            let surface = 'Asfalt Yol & Bisiklet Güzergahı';
            if (tags.natural === 'peak' || tags.tourism === 'viewpoint') {
              category = 'Climb';
              surface = 'Tırmanış Asfaltı & Seyir Yolu';
            } else if (tags.leisure === 'nature_reserve') {
              category = 'Gravel';
              surface = 'Doğa Parkuru & Gravel Zemin';
            } else if (tags.leisure === 'marina' || tags.natural === 'beach' || tags.natural === 'bay') {
              category = 'Coastal';
              surface = 'Sahil Şeridi Asfaltı';
            }

            candidates.push({
              id: `osm-${el.id}`,
              name: String(pName),
              lat: Number(pLat),
              lng: Number(pLng),
              category,
              surface,
              source: 'openstreetmap',
            });
          }
        }
      } catch (_) {}
    }

    // Score and select candidates whose loop length matches requested targetDistanceKm
    const idealDirectM = (targetDistanceKm * 1000) / 2.25;
    const chosen: CandidateSpot[] = [];
    const seenNames = new Set<string>();
    const sortedCandidates = candidates.sort((a, b) => {
      const diffA = Math.abs(haversineMeters(origin, a) - idealDirectM);
      const diffB = Math.abs(haversineMeters(origin, b) - idealDirectM);
      return diffA - diffB;
    });

    for (const c of sortedCandidates) {
      const key = c.name.toLowerCase().trim();
      if (seenNames.has(key)) continue;
      const tooCloseToChosen = chosen.some(
        (prev) => haversineMeters({ lat: prev.lat, lng: prev.lng }, { lat: c.lat, lng: c.lng }) < 1100
      );
      if (tooCloseToChosen) continue;
      seenNames.add(key);
      chosen.push(c);
      if (chosen.length >= 6) break;
    }

    const builtRoutes: any[] = [];
    let usedGoogleRoutes = false;

    for (let i = 0; i < chosen.length; i++) {
      const spot = chosen[i];
      // For longer distances (>= 30km) pair with a second distinct POI to build a wider real cycling loop
      const secondSpot =
        targetDistanceKm >= 30 && chosen.length > 1 ? chosen[(i + 1) % chosen.length] : null;
      const intermediatesList = secondSpot && secondSpot.id !== spot.id
        ? [spot, secondSpot]
        : [spot];

      let decodedPoints: Array<{ lat: number; lng: number }> = [];
      let distanceMeters = 0;
      let durationSec = 0;
      let routeSource: 'google_maps' | 'openstreetmap' = spot.source;

      // Try Google Routes API (travelMode: "BICYCLE", omitting routingPreference) when key & Google Places available
      if (usedGooglePlaces && mapsApiKey) {
        try {
          const rResp = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': mapsApiKey,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
              'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
            },
            body: JSON.stringify({
              origin: { location: { latLng: { latitude: lat, longitude: lng } } },
              intermediates: intermediatesList.map((pt) => ({
                via: true,
                location: { latLng: { latitude: pt.lat, longitude: pt.lng } },
              })),
              destination: { location: { latLng: { latitude: lat, longitude: lng } } },
              travelMode: 'BICYCLE',
              units: 'METRIC',
            }),
            signal: AbortSignal.timeout(6000),
          });
          if (rResp.ok) {
            const rJson: any = await rResp.json();
            const r0 = rJson.routes?.[0];
            if (r0?.polyline?.encodedPolyline) {
              decodedPoints = decodeGooglePolyline(r0.polyline.encodedPolyline);
              distanceMeters = Number(r0.distanceMeters) || 0;
              durationSec = parseInt(String(r0.duration || '0').replace('s', ''), 10) || 0;
              usedGoogleRoutes = true;
              routeSource = 'google_maps';
            }
          }
        } catch (_) {}
      }

      // OSRM Bike routing fallback (real OpenStreetMap cycling road network)
      const osrmCoords = [
        `${lng},${lat}`,
        ...intermediatesList.map((pt) => `${pt.lng},${pt.lat}`),
        `${lng},${lat}`,
      ].join(';');

      if (decodedPoints.length < 2) {
        try {
          const osrmUrl = `https://routing.openstreetmap.de/routed-bike/route/v1/bicycle/${osrmCoords}?overview=full&geometries=geojson`;
          const oResp = await fetch(osrmUrl, { signal: AbortSignal.timeout(6500) });
          if (oResp.ok) {
            const oJson: any = await oResp.json();
            const oRoute = oJson.routes?.[0];
            if (oRoute?.geometry?.coordinates?.length >= 2) {
              decodedPoints = oRoute.geometry.coordinates.map(([cLng, cLat]: [number, number]) => ({
                lat: cLat,
                lng: cLng,
              }));
              distanceMeters = Number(oRoute.distance) || 0;
              durationSec = Number(oRoute.duration) || 0;
              routeSource = 'openstreetmap';
            }
          }
        } catch (_) {}
      }

      // Secondary public OSRM server if routed-bike timed out
      if (decodedPoints.length < 2) {
        try {
          const osrmUrl2 = `https://router.project-osrm.org/route/v1/cycling/${osrmCoords}?overview=full&geometries=geojson`;
          const oResp2 = await fetch(osrmUrl2, { signal: AbortSignal.timeout(6500) });
          if (oResp2.ok) {
            const oJson2: any = await oResp2.json();
            const oRoute2 = oJson2.routes?.[0];
            if (oRoute2?.geometry?.coordinates?.length >= 2) {
              decodedPoints = oRoute2.geometry.coordinates.map(([cLng, cLat]: [number, number]) => ({
                lat: cLat,
                lng: cLng,
              }));
              distanceMeters = Number(oRoute2.distance) || 0;
              durationSec = Number(oRoute2.duration) || 0;
              routeSource = 'openstreetmap';
            }
          }
        } catch (_) {}
      }

      if (decodedPoints.length < 2) continue;

      const distanceKm = Number((distanceMeters / 1000).toFixed(1));
      if (distanceKm < 1.2) continue;

      const estimatedTimeMin = Math.max(8, Math.round(durationSec > 0 ? durationSec / 60 : (distanceKm / 24) * 60));
      const sampledPath = samplePath(decodedPoints, 20);
      const elevations = await fetchElevationsForPath(sampledPath, mapsApiKey, routeSource === 'google_maps');
      const elevStats = buildElevationStats(sampledPath, elevations, distanceKm);

      const renderWaypoints = samplePath(decodedPoints, 48).map((p, idx, arr) => {
        const elevIdx = Math.min(elevations.length - 1, Math.round((idx / Math.max(1, arr.length - 1)) * (elevations.length - 1)));
        return { lat: p.lat, lng: p.lng, alt: elevations[elevIdx] ?? 0 };
      });

      const directDistKm = Number((haversineMeters(origin, { lat: spot.lat, lng: spot.lng }) / 1000).toFixed(1));
      const heading = bearingDeg(origin, { lat: spot.lat, lng: spot.lng });
      const difficulty: 'Kolay' | 'Orta' | 'Zor' =
        elevStats.climbM > 420 || distanceKm > 45 || elevStats.maxGradientPct >= 7.5
          ? 'Zor'
          : elevStats.climbM > 140 || distanceKm > 18
          ? 'Orta'
          : 'Kolay';

      const finalCategory: CandidateSpot['category'] =
        elevStats.climbM >= 320 && spot.category === 'Road' ? 'Climb' : spot.category;

      const loopName =
        secondSpot && secondSpot.id !== spot.id
          ? `${spot.name} – ${secondSpot.name} Döngüsü`
          : `${spot.name} Döngüsü`;

      builtRoutes.push({
        id: `nearby-${spot.id}-${targetDistanceKm}`,
        name: loopName,
        slug: `nearby-${spot.id}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
        category: finalCategory,
        difficulty,
        distanceKm,
        distanceFromUserKm: directDistKm,
        climbM: elevStats.climbM,
        descentM: elevStats.descentM,
        avgGradientPct: elevStats.avgGradientPct,
        maxGradientPct: elevStats.maxGradientPct,
        rampCount: elevStats.rampCount,
        estimatedTimeMin,
        surface: spot.surface,
        tags: [finalCategory, difficulty, routeSource === 'google_maps' ? 'Google Routes' : 'OSM Bikeway'],
        rating: 4.8,
        riderCount: 0,
        recommendedWindDir: `${cardinalTr(heading)} / ${cardinalTr(heading + 180)}`,
        idealWindDeg: Math.round(heading),
        startPoint: renderWaypoints[0],
        endPoint: renderWaypoints[renderWaypoints.length - 1],
        center: { lat: spot.lat, lng: spot.lng },
        description: `Konumunuzdan ${directDistKm} km mesafedeki ${spot.name} üzerinden geçen gerçek yol/bisiklet ağı gidiş-dönüş parkuru.`,
        waypoints: renderWaypoints,
        elevationProfile: elevStats.elevationProfile,
        highlights: [
          spot.address ? spot.address : `${spot.name} geçiş noktası`,
          `${distanceKm} km gerçek yol geometrisi`,
          `+${elevStats.climbM} m irtifa · ${elevStats.rampCount} tırmanış/rampa geçişi`,
        ],
        source: routeSource,
        googleMapsUri: spot.googleMapsUri || undefined,
      });
    }

    // Prioritize routes matching requested difficulty and targetDistanceKm
    builtRoutes.sort((a, b) => {
      const aDiffMatch = requestedDifficulty === 'all' || a.difficulty === requestedDifficulty ? 0 : 1;
      const bDiffMatch = requestedDifficulty === 'all' || b.difficulty === requestedDifficulty ? 0 : 1;
      if (aDiffMatch !== bDiffMatch) return aDiffMatch - bDiffMatch;
      return Math.abs(a.distanceKm - targetDistanceKm) - Math.abs(b.distanceKm - targetDistanceKm);
    });

    const betaNotice = usedGoogleRoutes
      ? 'Bisiklet rotaları beta aşamasındadır; bazı yollarda bisiklet şeridi veya kaldırım bilgisi eksik olabilir — sürüş sırasında trafik kurallarına uyun.'
      : undefined;

    const payloadSource = usedGoogleRoutes ? 'google_maps' : 'openstreetmap';

    if (builtRoutes.length > 0) {
      nearbyRoutesCache.set(cacheKey, {
        routes: builtRoutes,
        source: payloadSource,
        betaNotice,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }

    res.json({
      ok: true,
      source: payloadSource,
      betaNotice,
      routes: builtRoutes,
    });
  } catch (err: any) {
    console.error('[Nearby Routes Error]:', err);
    res.status(500).json({ error: err?.message || 'Yakındaki rotalar hesaplanırken hata oluştu.' });
  }
});

// Serve frontend in dev via Vite middlewares, or static in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[PEL Server] Live running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
