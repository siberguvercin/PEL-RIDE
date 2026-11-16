import { ChatMessage, StreamSession, GroupRide, ActiveRider, OnlineUser } from '../types';

type Listener<T> = (data: T) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener<any>>> = new Map();
  private reconnectTimer: any = null;
  public isConnected: boolean = false;
  private userId: string = '';
  private userName: string = '';
  private userAvatar: string = '';
  private onlineUsers: OnlineUser[] = [];
  private privateMessages: ChatMessage[] = [];

  constructor() {
    this.initUser();
  }

  private initUser() {
    let savedId = localStorage.getItem('pel_user_id');
    let savedName = localStorage.getItem('pel_user_name');
    if (!savedId) {
      savedId = 'rider-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('pel_user_id', savedId);
    }
    if (!savedName) {
      const names = ['Peloton Sürücüsü', 'Rüzgar Avcısı', 'Aero Rider', 'Yol Savaşçısı', 'Gravel Pro', 'Zirve Tırmanıcı'];
      savedName = names[Math.floor(Math.random() * names.length)];
      localStorage.setItem('pel_user_name', savedName);
    }
    this.userId = savedId;
    this.userName = savedName;
  }

  public getUser() {
    return { id: this.userId, name: this.userName, avatar: this.userAvatar };
  }

  public getOnlineUsers(): OnlineUser[] {
    return this.onlineUsers;
  }

  public getCachedPrivateMessages(): ChatMessage[] {
    return this.privateMessages;
  }

  public getDmRoomId(otherUserId: string): string {
    const cleanA = (this.userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanB = (otherUserId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pair = [cleanA, cleanB].sort();
    return `dm_${pair[0]}__${pair[1]}`;
  }

  public setUser(user: { id?: string; name?: string; avatar?: string }) {
    if (user.id) {
      this.userId = user.id;
      localStorage.setItem('pel_user_id', user.id);
    }
    if (user.name) {
      this.userName = user.name;
      localStorage.setItem('pel_user_name', user.name);
    }
    if (user.avatar !== undefined) {
      this.userAvatar = user.avatar;
    }
    this.send({
      type: 'set_user',
      userId: this.userId,
      userName: this.userName,
      userAvatar: this.userAvatar
    });
  }

  public setUserName(name: string) {
    this.setUser({ name });
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', true);
        this.send({
          type: 'set_user',
          userId: this.userId,
          userName: this.userName,
          userAvatar: this.userAvatar
        });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init_sync' && Array.isArray(data.onlineUsers)) {
            this.onlineUsers = data.onlineUsers;
          }
          if (data.type === 'online_users_update' && Array.isArray(data.onlineUsers)) {
            this.onlineUsers = data.onlineUsers;
          }
          if (data.type === 'private_messages_sync' && Array.isArray(data.messages)) {
            this.privateMessages = data.messages;
          }
          if (data.type === 'new_chat_message' && data.message?.isPrivate) {
            if (!this.privateMessages.some((m) => m.id === data.message.id)) {
              this.privateMessages = [...this.privateMessages, data.message];
            }
          }
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WS error:', err);
        this.isConnected = false;
      };
    } catch (err) {
      console.error('WS connection failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  public send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public on<T = any>(event: string, callback: Listener<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off<T = any>(event: string, callback: Listener<T>) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      }
    }
  }

  // High-level Actions
  public sendChatMessage(
    text: string,
    roomId = 'global',
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    msgType: 'chat' | 'alert' = 'chat',
    privateTarget?: { id: string; name: string },
    explicitId?: string
  ): string {
    const isPrivate = Boolean(privateTarget || roomId.startsWith('dm_') || roomId.startsWith('dm:'));
    const msgId = explicitId || ('msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6));
    const payload = {
      id: msgId,
      roomId,
      userId: this.userId,
      userName: this.userName,
      userAvatar: this.userAvatar,
      recipientId: privateTarget?.id,
      recipientName: privateTarget?.name,
      isPrivate,
      text,
      mediaUrl,
      mediaType,
      msgType,
      type: msgType
    };

    const sentOverWs = this.send({
      ...payload,
      type: 'chat_message'
    });

    if (!sentOverWs) {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.message) {
            this.emit('new_chat_message', { message: data.message });
          }
        })
        .catch((err) => console.warn('HTTP chat fallback error:', err));
    }
    return msgId;
  }

  public sendPrivateMessage(
    recipient: { id: string; name: string },
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    explicitId?: string
  ): { msgId: string; dmRoomId: string } {
    const dmRoomId = this.getDmRoomId(recipient.id);
    const msgId = this.sendChatMessage(text, dmRoomId, mediaUrl, mediaType, 'chat', recipient, explicitId);
    return { msgId, dmRoomId };
  }

  public startLiveStream(streamId: string, title: string, category: string, telemetry: { speed: number; altitude: number; distance: number; lat: number; lng: number }) {
    this.send({
      type: 'start_stream',
      streamId,
      userId: this.userId,
      userName: this.userName,
      title,
      category,
      ...telemetry
    });
  }

  public stopLiveStream(streamId: string) {
    this.send({
      type: 'stop_stream',
      streamId
    });
  }

  public joinStream(streamId: string) {
    this.send({
      type: 'join_stream',
      streamId
    });
  }

  public leaveStream() {
    this.send({
      type: 'leave_stream'
    });
  }

  public sendStreamTelemetry(streamId: string, telemetry: { speed?: number; altitude?: number; distance?: number; lat?: number; lng?: number; heartRate?: number }) {
    this.send({
      type: 'stream_telemetry',
      streamId,
      ...telemetry
    });
  }

  public sendStreamRelayFrame(streamId: string, frame: string) {
    this.send({
      type: 'stream_relay_frame',
      streamId,
      frame
    });
  }

  public sendStreamReaction(streamId: string, emoji: string) {
    this.send({
      type: 'stream_reaction',
      streamId,
      emoji,
      userName: this.userName
    });
  }

  public sendTypingStatus(roomId: string, isTyping: boolean) {
    this.send({
      type: 'typing_status',
      roomId,
      userId: this.userId,
      userName: this.userName,
      isTyping
    });
  }

  public sendWebRtcOffer(streamId: string, targetUserId: string, sdp: RTCSessionDescriptionInit) {
    this.send({
      type: 'webrtc_offer',
      streamId,
      targetUserId,
      sdp
    });
  }

  public sendWebRtcAnswer(streamId: string, targetUserId: string, sdp: RTCSessionDescriptionInit) {
    this.send({
      type: 'webrtc_answer',
      streamId,
      targetUserId,
      sdp
    });
  }

  public sendWebRtcIce(streamId: string, targetUserId: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'webrtc_ice',
      streamId,
      targetUserId,
      candidate
    });
  }

  public sendRiderLocation(location: { lat: number; lng: number; speed: number; heading: number; altitude: number; heartRate?: number }) {
    this.send({
      type: 'rider_location',
      riderId: this.userId,
      name: this.userName,
      ...location
    });
  }

  public createGroupRide(title: string, date: string, distanceKm: number, elevationM: number, meetingPoint: string, lat: number, lng: number) {
    this.send({
      type: 'create_group_ride',
      title,
      date,
      distanceKm,
      elevationM,
      meetingPoint,
      lat,
      lng,
      creatorId: this.userId,
      creatorName: this.userName
    });
  }

  public joinGroupRide(code: string) {
    this.send({
      type: 'join_group_ride',
      code,
      riderName: this.userName
    });
  }

  public sendPelotonRadioSignal(signalType: 'hazard' | 'break' | 'echelon' | 'sprint' | 'mechanical', title: string) {
    this.send({
      type: 'peloton_radio_signal',
      signalType,
      title,
      senderName: this.userName
    });
  }

  public sendEmergencySos(data: { lat: number; lng: number; battery?: number; message?: string }) {
    this.send({
      type: 'emergency_sos_signal',
      riderName: this.userName,
      lat: data.lat,
      lng: data.lng,
      battery: data.battery,
      message: data.message
    });
  }
}

export const socketService = new SocketClient();
