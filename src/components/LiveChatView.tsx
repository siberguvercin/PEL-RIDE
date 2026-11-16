import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Image,
  AlertTriangle,
  Coffee,
  Users,
  Lock,
  Globe,
  Search,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';
import { ChatMessage, GroupRide, LeaderboardRider, OnlineUser } from '../types';
import { socketService } from '../services/socket';
import { validateContent, cleanProfanity } from '../utils/profanityFilter';
import {
  auth,
  PublicProfileDoc,
  DmThreadSummary,
  getDeterministicDmId,
  subscribePublicProfiles,
  subscribePublicMessages,
  persistPublicMessage,
  subscribeDmThreads,
  subscribeDmMessages,
  persistDmMessage,
} from '../firebase';

async function compressChatImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Görsel okunamadı'));
    reader.onload = (ev) => {
      const rawDataUrl = ev.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Görsel verisi boş'));
        return;
      }
      if (rawDataUrl.length <= 320000) {
        resolve(rawDataUrl);
        return;
      }
      const img = new window.Image();
      img.onerror = () => resolve(rawDataUrl.slice(0, 440000));
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        resolve(compressed);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export interface PrivateChatTarget {
  userId: string;
  userName: string;
  userAvatar?: string;
}

interface LiveChatViewProps {
  rides: GroupRide[];
  leaderboard?: LeaderboardRider[];
  selectedRideId?: string | null;
  selectedPrivateTarget?: PrivateChatTarget | null;
  onClearPrivateTarget?: () => void;
  onSelectRiderByName?: (userName: string) => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  rides,
  selectedRideId,
  selectedPrivateTarget,
  onClearPrivateTarget,
  onSelectRiderByName
}) => {
  const [sidebarTab, setSidebarTab] = useState<'rooms' | 'dm'>('rooms');
  const [activeRoom, setActiveRoom] = useState<string>(selectedRideId || 'global');
  const [activeDmPartner, setActiveDmPartner] = useState<PrivateChatTarget | null>(null);
  const [wsMessages, setWsMessages] = useState<ChatMessage[]>([]);
  const [firestoreRoomMessages, setFirestoreRoomMessages] = useState<ChatMessage[]>([]);
  const [firestoreDmMessages, setFirestoreDmMessages] = useState<ChatMessage[]>([]);
  const [allDmMessages, setAllDmMessages] = useState<ChatMessage[]>(() =>
    socketService.getCachedPrivateMessages()
  );
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(() => socketService.getOnlineUsers());
  const [publicProfiles, setPublicProfiles] = useState<PublicProfileDoc[]>([]);
  const [dmThreads, setDmThreads] = useState<DmThreadSummary[]>([]);
  const [unreadDmByRoom, setUnreadDmByRoom] = useState<Record<string, number>>({});
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(() => socketService.getUser());
  const [profanityNotice, setProfanityNotice] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingEmitRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync currentUser periodically or on connection changes
  useEffect(() => {
    setCurrentUser(socketService.getUser());
    const unConn = socketService.on('connection_change', () => {
      setCurrentUser(socketService.getUser());
    });
    return () => unConn();
  }, []);

  // Handle deep-link into a Group Ride room
  useEffect(() => {
    if (selectedRideId) {
      setActiveDmPartner(null);
      setSidebarTab('rooms');
      setActiveRoom(selectedRideId);
      setMobileShowChat(true);
    }
  }, [selectedRideId]);

  // Handle deep-link into a Private DM chat (e.g., from RiderProfileModal or Reels)
  useEffect(() => {
    if (selectedPrivateTarget && selectedPrivateTarget.userId) {
      const me = socketService.getUser();
      if (selectedPrivateTarget.userId !== me.id) {
        const dmRoom = socketService.getDmRoomId(selectedPrivateTarget.userId);
        setSidebarTab('dm');
        setActiveDmPartner(selectedPrivateTarget);
        setActiveRoom(dmRoom);
        setMobileShowChat(true);
        setUnreadDmByRoom((prev) => ({ ...prev, [dmRoom]: 0 }));
      }
      if (onClearPrivateTarget) {
        onClearPrivateTarget();
      }
    }
  }, [selectedPrivateTarget]);

  const isPrivateRoom = Boolean(
    activeDmPartner || activeRoom.startsWith('dm_') || activeRoom.startsWith('dm:')
  );

  // Merge Firestore persistent messages + live WS messages with deterministic deduplication
  const messages = useMemo(() => {
    const byId = new Map<string, ChatMessage>();
    if (isPrivateRoom) {
      firestoreDmMessages.forEach((m) => byId.set(m.id, m));
      allDmMessages
        .filter((m) => m.roomId === activeRoom)
        .forEach((m) => byId.set(m.id, m));
    } else {
      firestoreRoomMessages.forEach((m) => byId.set(m.id, m));
      wsMessages
        .filter((m) => m.roomId === activeRoom)
        .forEach((m) => byId.set(m.id, m));
    }
    return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [isPrivateRoom, activeRoom, firestoreRoomMessages, wsMessages, firestoreDmMessages, allDmMessages]);

  // Subscribe to verified community public profiles & DM threads in Firestore
  useEffect(() => {
    let unsubProfiles: (() => void) | undefined;
    let unsubThreads: (() => void) | undefined;
    try {
      unsubProfiles = subscribePublicProfiles((profiles) => {
        setPublicProfiles(profiles);
      });
    } catch (err) {
      console.warn('Public profiles subscription warning:', err);
    }

    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        unsubThreads = subscribeDmThreads(fbUser.uid, (threads) => {
          setDmThreads(threads);
        });
      } catch (err) {
        console.warn('DM threads subscription warning:', err);
      }
    }

    return () => {
      if (unsubProfiles) unsubProfiles();
      if (unsubThreads) unsubThreads();
    };
  }, [currentUser.id]);

  // Fetch initial online users & DM conversations over HTTP + WebSocket listeners
  useEffect(() => {
    const me = socketService.getUser();
    fetch('/api/users/online')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.onlineUsers)) {
          setOnlineUsers(data.onlineUsers);
        }
      })
      .catch(() => {});

    fetch(`/api/dm/conversations/${encodeURIComponent(me.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllDmMessages((prev) => {
            const byId = new Map<string, ChatMessage>();
            [...prev, ...data].forEach((m) => byId.set(m.id, m));
            return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
          });
        }
      })
      .catch(() => {});

    const unOnline = socketService.on('online_users_update', (data) => {
      if (Array.isArray(data?.onlineUsers)) {
        setOnlineUsers(data.onlineUsers);
      }
    });

    const unInit = socketService.on('init_sync', (data) => {
      if (Array.isArray(data?.onlineUsers)) {
        setOnlineUsers(data.onlineUsers);
      }
      if (
        Array.isArray(data?.recentMessages) &&
        !activeRoom.startsWith('dm_') &&
        !activeRoom.startsWith('dm:')
      ) {
        setWsMessages((prev) => {
          const roomMsgs = data.recentMessages.filter((m: ChatMessage) => m.roomId === activeRoom);
          const byId = new Map<string, ChatMessage>();
          [...prev, ...roomMsgs].forEach((m) => byId.set(m.id, m));
          return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });

    const unDmSync = socketService.on('private_messages_sync', (data) => {
      if (Array.isArray(data?.messages)) {
        setAllDmMessages((prev) => {
          const byId = new Map<string, ChatMessage>();
          [...prev, ...data.messages].forEach((m) => byId.set(m.id, m));
          return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });

    return () => {
      unOnline();
      unInit();
      unDmSync();
    };
  }, [activeRoom]);

  // Load room messages (Firestore + HTTP + WS real-time) & typing indicator
  useEffect(() => {
    const me = socketService.getUser();
    setCurrentUser(me);
    setFirestoreRoomMessages([]);
    setFirestoreDmMessages([]);

    let unsubFirestoreRoom: (() => void) | undefined;
    let unsubFirestoreDm: (() => void) | undefined;

    const fbUser = auth.currentUser;
    if (isPrivateRoom && fbUser) {
      try {
        unsubFirestoreDm = subscribeDmMessages(activeRoom, fbUser.uid, (msgs) => {
          setFirestoreDmMessages(msgs);
        });
      } catch (err) {
        console.warn('Firestore DM subscription warning:', err);
      }
    } else if (!isPrivateRoom && activeRoom !== 'all') {
      try {
        unsubFirestoreRoom = subscribePublicMessages(activeRoom, (msgs) => {
          setFirestoreRoomMessages(msgs);
        });
      } catch (err) {
        console.warn('Firestore public chat subscription warning:', err);
      }
    }

    fetch(`/api/chat/${encodeURIComponent(activeRoom)}?userId=${encodeURIComponent(me.id)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setWsMessages((prev) => {
            const byId = new Map<string, ChatMessage>();
            data.forEach((m: ChatMessage) => byId.set(m.id, m));
            prev
              .filter((m) => m.roomId === activeRoom)
              .forEach((m) => byId.set(m.id, m));
            return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
          });
        }
      })
      .catch((err) => console.warn('Chat fetch error:', err));

    const unsubscribe = socketService.on('new_chat_message', (data) => {
      const incoming: ChatMessage | undefined = data?.message;
      if (!incoming) return;

      setTypingUsers((prev) => {
        if (!prev[incoming.userId]) return prev;
        const copy = { ...prev };
        delete copy[incoming.userId];
        return copy;
      });

      if (incoming.isPrivate || incoming.roomId.startsWith('dm_') || incoming.roomId.startsWith('dm:')) {
        setAllDmMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        if (incoming.roomId !== activeRoom && incoming.userId !== me.id) {
          setUnreadDmByRoom((prev) => ({
            ...prev,
            [incoming.roomId]: (prev[incoming.roomId] || 0) + 1
          }));
        }
      }

      if (incoming.roomId === activeRoom || activeRoom === 'all') {
        setWsMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }
    });

    const unTyping = socketService.on('typing_status', (data) => {
      if (!data || data.roomId !== activeRoom || data.userId === me.id) return;
      setTypingUsers((prev) => {
        const copy = { ...prev };
        if (data.isTyping) {
          copy[data.userId] = data.userName || 'Bir kullanıcı';
        } else {
          delete copy[data.userId];
        }
        return copy;
      });
    });

    setTypingUsers({});

    return () => {
      unsubscribe();
      unTyping();
      if (unsubFirestoreRoom) unsubFirestoreRoom();
      if (unsubFirestoreDm) unsubFirestoreDm();
    };
  }, [activeRoom, isPrivateRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleOpenRoom = (roomId: string) => {
    setActiveDmPartner(null);
    setActiveRoom(roomId);
    setMobileShowChat(true);
  };

  const handleOpenDm = (partner: PrivateChatTarget) => {
    if (partner.userId === currentUser.id) return;
    const dmRoomId = socketService.getDmRoomId(partner.userId);
    setActiveDmPartner(partner);
    setActiveRoom(dmRoomId);
    setSidebarTab('dm');
    setMobileShowChat(true);
    setUnreadDmByRoom((prev) => ({ ...prev, [dmRoomId]: 0 }));
  };

  const dispatchPersistentMessage = (
    text: string,
    msgType: 'chat' | 'alert' = 'chat',
    mediaUrl?: string,
    mediaType?: 'image' | 'video'
  ) => {
    const fbUser = auth.currentUser;
    const nowTs = Date.now();
    if (activeDmPartner) {
      const { msgId } = socketService.sendPrivateMessage(
        { id: activeDmPartner.userId, name: activeDmPartner.userName },
        text,
        mediaUrl,
        mediaType
      );
      if (fbUser?.emailVerified) {
        persistDmMessage(
          fbUser,
          { id: activeDmPartner.userId, name: activeDmPartner.userName },
          { id: msgId, text, mediaUrl, mediaType, timestamp: nowTs }
        ).catch((err) => console.warn('Firestore DM persist error:', err));
      }
    } else {
      const msgId = socketService.sendChatMessage(text, activeRoom, mediaUrl, mediaType, msgType);
      if (fbUser?.emailVerified && activeRoom !== 'all') {
        persistPublicMessage(fbUser, {
          id: msgId,
          roomId: activeRoom,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          text,
          mediaUrl,
          mediaType,
          msgType,
          timestamp: nowTs,
        }).catch((err) => console.warn('Firestore public message persist error:', err));
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    const validation = validateContent(raw);
    let finalMessage = raw;

    if (!validation.isValid) {
      finalMessage = cleanProfanity(raw);
      setProfanityNotice('Sporcu ahlakı: Mesajınızdaki uygunsuz ifadeler sansürlenerek gönderildi.');
      setTimeout(() => setProfanityNotice(null), 4000);
    }

    dispatchPersistentMessage(finalMessage, 'chat');
    socketService.sendTypingStatus(activeRoom, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setInputText('');
  };

  const handleQuickAlert = (alertText: string) => {
    dispatchPersistentMessage(alertText, 'alert');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const compressedBase64 = await compressChatImageToBase64(file);
      dispatchPersistentMessage('📷 Fotoğraf paylaştı', 'chat', compressedBase64, 'image');
    } catch (err) {
      console.warn('Image upload compression error:', err);
    }
  };

  // Build unified DM contact directory from real Firestore profiles + live online users + DM threads
  const dmDirectory = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        userName: string;
        userAvatar?: string;
        isOnline: boolean;
        lastMessage?: ChatMessage;
        dmRoomId: string;
      }
    >();

    // 1. Registered community riders from Firestore /publicProfiles
    for (const p of publicProfiles) {
      if (!p.uid || p.uid === currentUser.id) continue;
      map.set(p.uid, {
        userId: p.uid,
        userName: p.displayName,
        userAvatar: p.photoUrl || undefined,
        isOnline: Boolean(p.isOnline),
        dmRoomId: getDeterministicDmId(currentUser.id, p.uid),
      });
    }

    // 2. Live WebSocket connected users override online status cleanly
    for (const u of onlineUsers) {
      if (u.userId === currentUser.id) continue;
      const existing = map.get(u.userId);
      map.set(u.userId, {
        userId: u.userId,
        userName: u.userName || existing?.userName || 'Sporcu',
        userAvatar: u.userAvatar || existing?.userAvatar,
        isOnline: Boolean(u.isOnline || existing?.isOnline),
        lastMessage: existing?.lastMessage,
        dmRoomId: socketService.getDmRoomId(u.userId),
      });
    }

    // 3. Firestore DM Thread summaries
    for (const th of dmThreads) {
      const otherId = th.participantIds.find((pid) => pid !== currentUser.id);
      if (!otherId) continue;
      const existing = map.get(otherId);
      if (!existing?.lastMessage || th.lastTimestamp > existing.lastMessage.timestamp) {
        map.set(otherId, {
          userId: otherId,
          userName: existing?.userName || 'Sporcu',
          userAvatar: existing?.userAvatar,
          isOnline: Boolean(existing?.isOnline),
          dmRoomId: th.id,
          lastMessage: {
            id: `thread-${th.id}`,
            roomId: th.id,
            userId: th.lastSenderId,
            userName: existing?.userName || 'Sporcu',
            isPrivate: true,
            text: th.lastMessageText,
            type: 'chat',
            timestamp: th.lastTimestamp,
          },
        });
      }
    }

    // 4. Existing WS/Cached DM thread messages
    for (const m of allDmMessages) {
      const otherId = m.userId === currentUser.id ? m.recipientId : m.userId;
      const otherName = m.userId === currentUser.id ? m.recipientName : m.userName;
      if (!otherId || otherId === currentUser.id) continue;
      const existing = map.get(otherId);
      const isOnline = existing?.isOnline || onlineUsers.some((u) => u.userId === otherId && u.isOnline);
      const prevLast = existing?.lastMessage;
      map.set(otherId, {
        userId: otherId,
        userName: otherName || existing?.userName || 'Sporcu',
        userAvatar: existing?.userAvatar || (m.userId !== currentUser.id ? m.userAvatar : undefined),
        isOnline,
        lastMessage: !prevLast || m.timestamp > prevLast.timestamp ? m : prevLast,
        dmRoomId: socketService.getDmRoomId(otherId)
      });
    }

    const q = dmSearchQuery.trim().toLowerCase();
    return Array.from(map.values())
      .filter((c) => !q || c.userName.toLowerCase().includes(q))
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        if (aTime !== bTime) return bTime - aTime;
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return a.userName.localeCompare(b.userName, 'tr');
      });
  }, [publicProfiles, onlineUsers, dmThreads, allDmMessages, currentUser.id, dmSearchQuery]);

  const totalUnreadDm = Object.values(unreadDmByRoom).reduce((sum, n) => sum + n, 0);
  const onlineNowCount = Math.max(
    onlineUsers.filter((u) => u.isOnline).length,
    publicProfiles.filter((p) => p.isOnline).length
  );
  const onlineOthersCount = dmDirectory.filter((d) => d.isOnline).length;

  const currentRoomTitle = isPrivateRoom
    ? activeDmPartner?.userName || 'Özel Sohbet'
    : activeRoom === 'global'
    ? 'Genel Peloton Sohbeti'
    : rides.find((r) => r.id === activeRoom || r.code === activeRoom)?.title || 'Grup Sürüş Odası';

  return (
    <div className="flex flex-col md:flex-row h-full w-full max-w-full min-w-0 bg-[#F4F5F7] text-[#18181B] overflow-hidden">
      {/* Channels / Rooms & Private DM Sidebar */}
      <div
        className={`${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-[#E2E4E9] flex-col flex-shrink-0 h-full overflow-hidden`}
      >
        <div className="p-3.5 border-b border-[#E2E4E9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-[#FC4C02] shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#18181B] truncate">
              Peloton İletişim
            </h2>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {Math.max(1, onlineNowCount)} Çevrimiçi
          </span>
        </div>

        {/* Sidebar Mode Switcher: Genel Odalar vs Özel Sohbet (DM) */}
        <div className="p-2 border-b border-[#E2E4E9] bg-[#F4F5F7]">
          <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-lg border border-[#E2E4E9]">
            <button
              type="button"
              onClick={() => setSidebarTab('rooms')}
              className={`py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sidebarTab === 'rooms'
                  ? 'bg-[#FC4C02] text-white'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Genel &amp; Odalar</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarTab('dm')}
              className={`py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
                sidebarTab === 'dm'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Özel Sohbet</span>
              {totalUnreadDm > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FC4C02] text-white text-[9px] font-bold">
                  {totalUnreadDm}
                </span>
              )}
            </button>
          </div>
        </div>

        {sidebarTab === 'rooms' ? (
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {/* Global Channel */}
            <button
              onClick={() => handleOpenRoom('global')}
              className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between cursor-pointer ${
                activeRoom === 'global' && !isPrivateRoom
                  ? 'bg-[#F8F9FA] border border-[#FC4C02] text-[#18181B] font-semibold'
                  : 'bg-white text-[#52525B] hover:bg-[#F4F5F7] border border-[#E2E4E9]'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Globe className="w-3.5 h-3.5 text-[#FC4C02] shrink-0" />
                  <span className="truncate text-[#18181B]">Genel Peloton</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    · Herkese Açık
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] truncate mt-0.5">
                  Bağlı tüm kullanıcılara anlık gönderilir
                </p>
              </div>
            </button>

            {/* Quick Private Chat CTA */}
            <button
              onClick={() => setSidebarTab('dm')}
              className="w-full text-left p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F4F5F7] border border-dashed border-[#D4D4DC] flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#18181B]">Özel Sohbet (DM) Başlat</div>
                  <div className="text-[10px] text-[#71717A] truncate">
                    {onlineOthersCount > 0
                      ? `${onlineOthersCount} çevrimiçi kullanıcı ile birebir yazış`
                      : 'Sporcularla gizli birebir sohbet'}
                  </div>
                </div>
              </div>
              {totalUnreadDm > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FC4C02] text-white text-[10px] font-bold">
                  {totalUnreadDm}
                </span>
              )}
            </button>

            {/* Group Rides Rooms */}
            <div className="pt-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Grup Sürüş Odaları
            </div>

            {rides.map((ride) => (
              <button
                key={ride.id}
                onClick={() => handleOpenRoom(ride.id)}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                  activeRoom === ride.id && !isPrivateRoom
                    ? 'bg-[#FFF4EE] border border-[#FC4C02]/40 text-[#18181B] font-bold'
                    : 'bg-white text-[#52525B] hover:bg-[#F4F5F7] border border-[#E2E4E9]'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                    <span className="truncate text-[#18181B]">{ride.title}</span>
                  </div>
                  <div className="text-[10px] text-[#71717A] flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[#FC4C02]">{ride.code}</span>
                    <span>·</span>
                    <span>{ride.participants} katılımcı</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Private Chat (DM) Contacts & Threads */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-[#E2E4E9]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dmSearchQuery}
                  onChange={(e) => setDmSearchQuery(e.target.value)}
                  placeholder="Çevrimiçi kullanıcı veya sporcu ara..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F8F9FA] border border-[#E2E4E9] focus:border-[#FC4C02] text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
              {dmDirectory.length === 0 ? (
                <div className="text-center py-8 px-3 text-xs text-[#878792] space-y-1.5">
                  <Users className="w-6 h-6 mx-auto text-[#B4B4BE]" />
                  <p className="font-bold text-[#242428]">Kullanıcı bulunamadı</p>
                  <p className="text-[11px]">
                    Uygulamaya başka bir kullanıcı bağlandığında burada anlık çevrimiçi görünecektir.
                  </p>
                </div>
              ) : (
                dmDirectory.map((contact) => {
                  const isSelected = activeRoom === contact.dmRoomId;
                  const unread = unreadDmByRoom[contact.dmRoomId] || 0;

                  return (
                    <button
                      key={contact.userId}
                      onClick={() =>
                        handleOpenDm({
                          userId: contact.userId,
                          userName: contact.userName,
                          userAvatar: contact.userAvatar
                        })
                      }
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-white text-[#18181B] border-[#E2E4E9] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {contact.userAvatar ? (
                          <img
                            src={contact.userAvatar}
                            alt={contact.userName}
                            className="w-9 h-9 rounded-lg object-cover border border-[#E2E4E9]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-[#FC4C02] text-white'
                                : 'bg-[#FFF4EE] text-[#FC4C02] border border-[#FCD5C3]'
                            }`}
                          >
                            {contact.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 ${
                            isSelected ? 'border-[#18181B]' : 'border-white'
                          } ${contact.isOnline ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                          title={contact.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{contact.userName}</span>
                          {contact.isOnline && (
                            <span
                              className={`text-[10px] font-semibold shrink-0 ${
                                isSelected ? 'text-emerald-300' : 'text-emerald-700'
                              }`}
                            >
                              · Aktif
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-zinc-300' : 'text-[#71717A]'
                          }`}
                        >
                          {contact.lastMessage
                            ? `${contact.lastMessage.userId === currentUser.id ? 'Sen: ' : ''}${
                                contact.lastMessage.text
                              }`
                            : 'Özel mesaj başlat...'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#FC4C02] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Conversation Screen */}
      <div
        className={`${
          mobileShowChat ? 'flex' : 'hidden md:flex'
        } flex-1 min-w-0 flex-col h-full bg-[#F4F5F7] overflow-hidden`}
      >
        {/* Room Header */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-[#E2E4E9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-1.5 rounded-lg bg-[#F4F5F7] border border-[#E2E4E9] text-[#18181B] cursor-pointer shrink-0"
              title="Odalar ve Kişiler"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-1.5 truncate">
                {isPrivateRoom ? (
                  <Lock className="w-3.5 h-3.5 text-[#FC4C02] shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span className="truncate">{currentRoomTitle}</span>
                {isPrivateRoom ? (
                  <span className="text-[11px] text-[#71717A] font-semibold shrink-0">
                    · Özel DM
                  </span>
                ) : activeRoom !== 'global' ? (
                  <span className="text-[11px] font-mono text-[#FC4C02] font-bold shrink-0">
                    · {rides.find((r) => r.id === activeRoom)?.code || activeRoom}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline shrink-0">
                    · Herkese Açık
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#71717A] truncate">
                {isPrivateRoom
                  ? `Sadece sen ve ${currentRoomTitle} görebilir · Adın: ${currentUser.name}`
                  : `Giriş yapılan isim: ${currentUser.name} · Mesajlar tüm aktif kullanıcılara gider`}
              </p>
            </div>
          </div>

          {/* Quick Alert Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleQuickAlert('DİKKAT: Yolda çukur / engel var.')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 hover:bg-rose-100 transition cursor-pointer"
              title="Yol Uyarısı Gönder"
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Engel / Çukur</span>
            </button>
            <button
              onClick={() => handleQuickAlert('Mola Noktası: 10 dk duruyoruz.')}
              className="px-2.5 py-1 rounded-lg bg-[#FFF4EE] text-[#FC4C02] border border-[#FCD5C3] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#FFEBE1] transition cursor-pointer"
              title="Mola Uyarısı"
            >
              <Coffee className="w-3 h-3 text-[#FC4C02]" />
              <span>Mola</span>
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto overflow-x-hidden space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-[#878792] space-y-2">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E5E5EB] flex items-center justify-center mx-auto text-[#FC4C02] shadow-sm">
                {isPrivateRoom ? <Lock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </div>
              <p className="text-xs font-bold text-[#242428]">
                {isPrivateRoom ? `${currentRoomTitle} ile özel sohbet başlat` : 'Bu odada henüz mesaj yok.'}
              </p>
              <p className="text-[11px] text-[#878792]">
                {isPrivateRoom
                  ? 'Gönderdiğiniz mesajlar sadece bu kişiye özel olarak iletilir.'
                  : 'İlk mesajı yazarak uygulamayı kullanan tüm sporcularla konuş!'}
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.userId === currentUser.id;

              if (m.type === 'alert') {
                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 max-w-md mx-auto shadow-sm"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <div className="min-w-0 break-words">
                      <span className="font-bold">{m.userName}:</span> {m.text}
                    </div>
                  </div>
                );
              }

              if (m.type === 'system') {
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-lg bg-white border border-[#E5E5EB] text-[#878792] text-[11px] text-center max-w-sm mx-auto shadow-sm"
                  >
                    {m.text}
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                    <span
                      onClick={() => !isMine && onSelectRiderByName && onSelectRiderByName(m.userName)}
                      className={`text-[10px] font-bold ${
                        isMine
                          ? 'text-[#FC4C02]'
                          : 'text-[#878792] hover:text-[#FC4C02] cursor-pointer hover:underline'
                      }`}
                      title={!isMine ? `${m.userName} profilini görüntüle` : undefined}
                    >
                      {isMine ? 'Sen' : m.userName}
                    </span>
                    {!isMine && !isPrivateRoom && m.userId !== 'user-pel-system' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenDm({
                            userId: m.userId,
                            userName: m.userName,
                            userAvatar: m.userAvatar
                          })
                        }
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white border border-[#E5E5EB] text-[#494950] hover:border-[#FC4C02] hover:text-[#FC4C02] cursor-pointer flex items-center gap-0.5"
                        title={`${m.userName} ile özel sohbet aç`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Özel Yaz</span>
                      </button>
                    )}
                    <span className="text-[9px] text-[#878792]">
                      {new Date(m.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl shadow-sm text-xs break-words leading-relaxed ${
                      isMine
                        ? isPrivateRoom
                          ? 'bg-[#242428] text-white rounded-br-sm'
                          : 'bg-[#FC4C02] text-white rounded-br-sm'
                        : 'bg-white text-[#242428] border border-[#E5E5EB] rounded-bl-sm'
                    }`}
                  >
                    {m.mediaUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                        <img
                          src={m.mediaUrl}
                          alt="Görsel"
                          className="max-h-60 w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] font-medium px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] animate-pulse" />
              <span>
                {Object.values(typingUsers).join(', ')} yazıyor...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E2E4E9]">
          {profanityNotice && (
            <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{profanityNotice}</span>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 min-w-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-[#F4F5F7] hover:bg-[#ECEEF2] text-[#71717A] hover:text-[#18181B] border border-[#E2E4E9] transition cursor-pointer shrink-0"
              title="Fotoğraf Yükle"
            >
              <Image className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={
                isPrivateRoom
                  ? `${currentRoomTitle} kullanıcısına özel mesaj yaz...`
                  : `${currentRoomTitle} odasına herkese yaz...`
              }
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                const now = Date.now();
                if (val.trim() && now - lastTypingEmitRef.current > 1500) {
                  lastTypingEmitRef.current = now;
                  socketService.sendTypingStatus(activeRoom, true);
                }
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socketService.sendTypingStatus(activeRoom, false);
                }, 2200);
              }}
              className="flex-1 min-w-0 bg-[#F8F9FA] text-xs sm:text-sm text-[#18181B] px-3.5 py-2.5 rounded-lg border border-[#E2E4E9] focus:border-[#FC4C02] outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition shrink-0 ${
                inputText.trim()
                  ? isPrivateRoom
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-white cursor-pointer'
                    : 'bg-[#FC4C02] hover:bg-[#E34402] text-white cursor-pointer'
                  : 'bg-[#F4F5F7] text-[#71717A] cursor-not-allowed border border-[#E2E4E9]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Gönder</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
