import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Users,
  Activity,
  Send,
  Heart,
  SwitchCamera,
  Mic,
  MicOff,
  Video,
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Film,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { socketService } from '../services/socket';
import { reelsService } from '../services/reelsService';
import { ChatMessage } from '../types';
import { CyclingReel } from '../types/reels';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpeed: number;
  currentAltitude: number;
  currentDistance: number;
  currentLocation: { lat: number; lng: number } | null;
  currentHeartRate?: number;
  initialMode?: 'record' | 'live';
  onReelPublished?: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  userName: string;
  x: number;
}

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  isOpen,
  onClose,
  currentSpeed,
  currentAltitude,
  currentDistance,
  currentLocation,
  currentHeartRate,
  initialMode = 'record',
  onReelPublished
}) => {
  const [mode, setMode] = useState<'record' | 'live'>(initialMode);
  const [streamTitle, setStreamTitle] = useState('PEL Sürüş Kaydı');
  const [category, setCategory] = useState('Road / Asfalt');
  const [isLive, setIsLive] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMuted, setIsMuted] = useState(false);
  const [viewersCount, setViewersCount] = useState(1);
  const [liveDuration, setLiveDuration] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Normal local video recording states (Canlı yayın olmadan)
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/webm');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRecordedBlobUrl(null);
      setStatusNotice(null);
      setCameraError(null);
      startCamera();
    } else {
      stopAll();
    }
    return () => {
      if (!isOpen) stopAll();
    };
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  useEffect(() => {
    if (!streamId) return;

    const unReaction = socketService.on('stream_reaction', (data) => {
      if (data.streamId === streamId) {
        const newReaction: FloatingReaction = {
          id: 'rx-' + Date.now() + '-' + Math.random(),
          emoji: data.emoji || '🔥',
          userName: data.userName || 'İzleyici',
          x: 20 + Math.random() * 60,
        };
        setFloatingReactions((prev) => [...prev.slice(-10), newReaction]);
        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
        }, 1800);
      }
    });

    const unViewers = socketService.on('stream_viewers_update', (data) => {
      if (data.streamId === streamId) {
        setViewersCount(data.viewers);
      }
    });

    const unChat = socketService.on('new_chat_message', (data) => {
      if (data.message && data.message.roomId === streamId) {
        setChatMessages((prev) => [...prev.slice(-30), data.message]);
      }
    });

    const createPeerForViewer = async (viewerId: string) => {
      const localStream = mediaStreamRef.current;
      if (!localStream || !viewerId) return;

      const existingPc = peerConnectionsRef.current.get(viewerId);
      if (existingPc) {
        try {
          existingPc.close();
        } catch (_) {}
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnectionsRef.current.set(viewerId, pc);

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendWebRtcIce(streamId, viewerId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(viewerId);
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.sendWebRtcOffer(streamId, viewerId, offer);
      } catch (err) {
        console.warn('WebRTC offer creation failed:', err);
      }
    };

    const unViewerJoined = socketService.on('stream_viewer_joined', (data) => {
      if (data.streamId === streamId && data.viewerId) {
        createPeerForViewer(data.viewerId);
      }
    });

    const unViewerLeft = socketService.on('stream_viewer_left', (data) => {
      if (data.streamId === streamId && data.viewerId) {
        const pc = peerConnectionsRef.current.get(data.viewerId);
        if (pc) {
          try {
            pc.close();
          } catch (_) {}
          peerConnectionsRef.current.delete(data.viewerId);
        }
      }
    });

    const unAnswer = socketService.on('webrtc_answer', async (data) => {
      if (data.streamId !== streamId || !data.fromUserId || !data.sdp) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const queued = pendingIceRef.current.get(data.fromUserId) || [];
        pendingIceRef.current.delete(data.fromUserId);
        for (const cand of queued) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      } catch (err) {
        console.warn('WebRTC answer error:', err);
      }
    });

    const unIce = socketService.on('webrtc_ice', async (data) => {
      if (data.streamId !== streamId || !data.fromUserId || !data.candidate) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (_) {}
      } else {
        const arr = pendingIceRef.current.get(data.fromUserId) || [];
        arr.push(data.candidate);
        pendingIceRef.current.set(data.fromUserId, arr);
      }
    });

    return () => {
      unReaction();
      unViewers();
      unChat();
      unViewerJoined();
      unViewerLeft();
      unAnswer();
      unIce();
    };
  }, [streamId]);

  useEffect(() => {
    if (!isLive || !streamId) return;

    const telemetryInterval = setInterval(() => {
      socketService.sendStreamTelemetry(streamId, {
        speed: currentSpeed,
        altitude: currentAltitude,
        distance: currentDistance,
        lat: currentLocation?.lat,
        lng: currentLocation?.lng,
        heartRate: currentHeartRate
      });
    }, 1500);

    return () => clearInterval(telemetryInterval);
  }, [isLive, streamId, currentSpeed, currentAltitude, currentDistance, currentLocation, currentHeartRate]);

  const replaceTracksInPeers = (newStream: MediaStream) => {
    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];
    peerConnectionsRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video' && videoTrack) {
          sender.replaceTrack(videoTrack).catch(() => {});
        }
        if (sender.track?.kind === 'audio' && audioTrack) {
          sender.replaceTrack(audioTrack).catch(() => {});
        }
      });
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      replaceTracksInPeers(stream);
    } catch (err: any) {
      console.warn('Camera fallback to video only:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        replaceTracksInPeers(stream);
      } catch (e: any) {
        setCameraError('Kamera erişimi sağlanamadı: ' + (e.message || 'İzin gerekli'));
      }
    }
  };

  // Start Normal Video Recording (WITHOUT Live Broadcast)
  const handleStartNormalRecord = () => {
    if (!mediaStreamRef.current) {
      setCameraError('Kayıt için aktif kamera akışı bulunamadı.');
      return;
    }

    try {
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      recordedChunksRef.current = [];
      const recorder = supportedMime
        ? new MediaRecorder(mediaStreamRef.current, { mimeType: supportedMime })
        : new MediaRecorder(mediaStreamRef.current);

      setRecordedMimeType(recorder.mimeType || supportedMime || 'video/webm');

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
        setIsRecordingPaused(false);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordDuration(0);
      setRecordedBlobUrl(null);
      setStatusNotice(null);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    } catch (err: any) {
      setCameraError('Video kaydı başlatılamadı: ' + (err.message || 'Tarayıcı desteklemiyor'));
    }
  };

  const handleTogglePauseRecord = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === 'recording') {
      recorder.pause();
      setIsRecordingPaused(true);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    } else if (recorder.state === 'paused') {
      recorder.resume();
      setIsRecordingPaused(false);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    }
  };

  const handleStopNormalRecord = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setIsRecordingPaused(false);
    }
  };

  const handleDownloadRecordedVideo = () => {
    if (!recordedBlobUrl) return;
    const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `pel-surus-kaydi-${Date.now()}.${ext}`;
    a.click();
    setStatusNotice('Video cihazınıza indirildi!');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handlePublishRecordedToReels = () => {
    if (!recordedBlobUrl) return;

    const currentUser = socketService.getUser();
    let riderName = currentUser.name || 'Bisikletçi';
    let riderAvatar: string | undefined = currentUser.avatar || undefined;
    try {
      const gUser = localStorage.getItem('pel_google_user');
      if (gUser) {
        const parsed = JSON.parse(gUser);
        if (parsed.name) riderName = parsed.name;
        if (parsed.photoUrl) riderAvatar = parsed.photoUrl;
      }
    } catch (_) {}

    const riderHandle = '@' + riderName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const newReel: CyclingReel = {
      id: `reel-rec-${Date.now()}`,
      mediaType: 'video',
      videoUrl: recordedBlobUrl,
      posterUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
      riderName,
      riderHandle,
      riderAvatar,
      isVerified: true,
      caption: streamTitle.trim() || 'Normal sürüş kamera kaydım! 🚴‍♂️🎬',
      tags: ['#sürüşkaydı', '#peloton', '#normalKayıt'],
      location: category,
      songTitle: `Orijinal Ses - ${riderName}`,
      audioSourceType: 'custom_voice',
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      durationSec: Math.max(recordDuration, 5),
      date: 'Şimdi',
      isLiked: true,
      isMyReel: true,
      viewsCount: 1,
      telemetry: currentSpeed > 0 ? {
        speedKmH: Number(currentSpeed.toFixed(1)),
        watts: Math.round(currentSpeed * 6.2),
        gradientPct: 2.1,
        heartRateBpm: currentHeartRate || 152,
        distanceKm: Number(currentDistance.toFixed(1))
      } : undefined
    };

    reelsService.addReel(newReel);
    setStatusNotice('Video Reels akışınıza ve profilinize kaydedildi!');
    setTimeout(() => {
      if (onReelPublished) {
        onReelPublished();
      }
      onClose();
    }, 900);
  };

  const handleResetNormalRecord = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordDuration(0);
    setStatusNotice(null);
    startCamera();
  };

  const handleStartBroadcast = () => {
    const id = 'stream-' + Date.now();
    setStreamId(id);
    setIsLive(true);
    setLiveDuration(0);

    socketService.startLiveStream(id, streamTitle, category, {
      speed: currentSpeed,
      altitude: currentAltitude,
      distance: currentDistance,
      lat: currentLocation?.lat || 41.0082,
      lng: currentLocation?.lng || 28.9784,
    });

    timerRef.current = setInterval(() => {
      setLiveDuration((d) => d + 1);
    }, 1000);

    // Send lightweight preview thumbnail periodically for stream cards & NAT fallback
    frameIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v.readyState < 2) return;

      c.width = 360;
      c.height = 240;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/webp', 0.55);
        socketService.sendStreamRelayFrame(id, dataUrl);
      }
    }, 1500);
  };

  const handleStopBroadcast = () => {
    if (streamId) {
      socketService.stopLiveStream(streamId);
    }
    stopAll();
    setIsLive(false);
    setStreamId(null);
    onClose();
  };

  const stopAll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch (_) {}
    });
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !streamId) return;
    socketService.sendChatMessage(chatInput.trim(), streamId);
    setChatInput('');
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-white border border-[#E5E5EB] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-3.5 bg-white border-b border-[#E5E5EB]">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isLive
                  ? 'bg-[#FC4C02] animate-pulse'
                  : isRecording
                  ? isRecordingPaused
                    ? 'bg-amber-500'
                    : 'bg-rose-600 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#242428]">
              {isLive
                ? '🔴 CANLI YAYINDASINIZ'
                : isRecording
                ? isRecordingPaused
                  ? '⏸ KAYIT DURAKLATILDI'
                  : '⏺ NORMAL VİDEO KAYDI (YAYINSIZ)'
                : recordedBlobUrl
                ? '✅ KAYIT TAMAMLANDI'
                : mode === 'record'
                ? 'NORMAL VİDEO KAYDI'
                : 'CANLI YAYIN BAŞLAT'}
            </span>
            {(isLive || isRecording) && (
              <span className="text-xs font-mono font-bold text-[#FC4C02] ml-2">
                {formatDuration(isLive ? liveDuration : recordDuration)}
              </span>
            )}
          </div>
          <button
            onClick={isLive ? handleStopBroadcast : onClose}
            className="p-1 rounded-lg text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Error Banner */}
        {cameraError && (
          <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Status Notice */}
        {statusNotice && (
          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Video Viewport with HUD Overlays */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          {recordedBlobUrl ? (
            <video
              src={recordedBlobUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Floating Reactions (Live Only) */}
          {isLive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  style={{ left: `${r.x}%`, bottom: '20%' }}
                  className="absolute animate-float-reaction text-2xl flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/10"
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px] text-white font-semibold">{r.userName}</span>
                </div>
              ))}
            </div>
          )}

          {/* HUD Overlay */}
          {!recordedBlobUrl && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#E5E5EB] shadow-sm">
                <span className="text-[10px] font-bold text-[#FC4C02]">HIZ</span>
                <span className="text-lg font-black font-mono text-[#242428] leading-none">
                  {currentSpeed.toFixed(1)}{' '}
                  <small className="text-[10px] font-normal text-[#878792]">km/sa</small>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md border border-[#E5E5EB] text-[#242428] text-[11px] font-mono shadow-sm">
                <Activity className="w-3.5 h-3.5 text-[#FC4C02]" />
                <span>{Math.round(currentAltitude)} m İrtifa</span>
                <span>•</span>
                <span>{currentDistance.toFixed(2)} km</span>
              </div>

              {currentHeartRate && currentHeartRate > 40 && (
                <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#E5E5EB] text-[#FC4C02] text-[11px] font-mono shadow-sm">
                  <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span className="font-black text-[#242428]">{currentHeartRate}</span>
                  <span className="text-[9px] text-[#878792]">BPM</span>
                </div>
              )}
            </div>
          )}

          {/* Status & Category Tag */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
            {isLive && (
              <div className="flex items-center gap-1.5 bg-[#FC4C02] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
                <Users className="w-3.5 h-3.5" />
                <span>{viewersCount} İzleyici</span>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-1.5 bg-rose-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>REC {formatDuration(recordDuration)}</span>
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-md text-[#242428] px-2 py-1 rounded-md text-[10px] font-bold border border-[#E5E5EB] shadow-sm">
              {category}
            </div>
          </div>

          {/* Camera Quick Controls */}
          {!recordedBlobUrl && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={toggleCameraFacing}
                disabled={isRecording}
                className="p-2 rounded-full bg-white/90 hover:bg-white text-[#242428] border border-[#E5E5EB] transition shadow-md cursor-pointer disabled:opacity-50"
                title="Kamerayı Değiştir"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/90 hover:bg-white text-[#242428] border border-[#E5E5EB] transition shadow-md cursor-pointer"
                title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Live Broadcast Chat Overlay when Streaming */}
        {isLive && (
          <div className="flex flex-col bg-[#F7F7FA] border-t border-[#E5E5EB] max-h-36 sm:max-h-48">
            <div className="p-2 overflow-y-auto flex-1 space-y-1.5 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-[#878792] py-2 text-xs">
                  Yayın sohbeti aktif. İzleyicilerden gelen mesajlar burada görünür.
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-1.5 text-xs">
                    <span className="font-bold text-[#FC4C02]">{m.userName}:</span>
                    <span className="text-[#242428]">{m.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendChat} className="p-2 border-t border-[#E5E5EB] flex gap-2 bg-white">
              <input
                type="text"
                placeholder="Yayıncı mesajı..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#F7F7FA] text-xs text-[#242428] px-3 py-1.5 rounded-lg border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#FC4C02] text-white font-bold text-xs rounded-lg hover:bg-[#E34402] transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Active Normal Recording Controls */}
        {isRecording && !isLive && (
          <div className="p-4 bg-white border-t border-[#E5E5EB] flex items-center justify-between gap-3">
            <div className="text-xs text-[#6B7280] font-medium">
              Video yalnızca cihazınıza kaydediliyor (canlı yayın açılmadı).
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTogglePauseRecord}
                className="px-4 py-2.5 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#242428] border border-[#E5E5EB] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {isRecordingPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Devam Et</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Duraklat</span>
                  </>
                )}
              </button>
              <button
                onClick={handleStopNormalRecord}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Kaydı Bitir</span>
              </button>
            </div>
          </div>
        )}

        {/* Post-Recording Preview Actions */}
        {recordedBlobUrl && !isRecording && !isLive && (
          <div className="p-4 bg-white space-y-3 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                Kayıt Başlığı / Açıklama
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-[#F7F7FA] text-sm text-[#242428] px-3 py-2 rounded-lg border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                placeholder="Örn: Sahil Yolu Sabah Sürüşü"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleDownloadRecordedVideo}
                className="py-2.5 px-3 rounded-xl bg-[#242428] hover:bg-[#333333] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cihaza İndir</span>
              </button>

              <button
                onClick={handlePublishRecordedToReels}
                className="py-2.5 px-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Reels'ta Paylaş</span>
              </button>

              <button
                onClick={handleResetNormalRecord}
                className="py-2.5 px-3 rounded-xl bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#242428] border border-[#E5E5EB] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeni Kayıt</span>
              </button>
            </div>
          </div>
        )}

        {/* Setup Controls (Before Live or Recording) */}
        {!isLive && !isRecording && !recordedBlobUrl && (
          <div className="p-4 bg-white space-y-3 overflow-y-auto">
            {/* Mode Switcher: Normal Kayıt vs Canlı Yayın */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F4F6] rounded-xl border border-[#E5E5EB]">
              <button
                type="button"
                onClick={() => setMode('record')}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mode === 'record'
                    ? 'bg-[#242428] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#242428]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Normal Kayıt (Yayınsız)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('live')}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mode === 'live'
                    ? 'bg-[#FC4C02] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#242428]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Canlı Yayın</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                {mode === 'record' ? 'Kayıt Başlığı' : 'Yayın Başlığı'}
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-[#F7F7FA] text-sm text-[#242428] px-3 py-2 rounded-lg border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                placeholder="Örn: Belgrad Ormanı Tempolu Sürüş"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                Sürüş Türü
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Road / Asfalt', 'Gravel & Doğa', 'MTB & Arazi'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                      category === cat
                        ? 'bg-[#FFF2ED] text-[#FC4C02] border-[#FC4C02]'
                        : 'bg-[#F7F7FA] text-[#878792] border-[#E5E5EB] hover:border-[#D1D1D8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'record' ? (
              <>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  🎥 Canlı yayın başlatmadan sadece kendi cihazınız için normal video kaydı alın. Kayıt bitince videoyu indirebilir veya Reels olarak paylaşabilirsiniz.
                </p>

                <button
                  onClick={handleStartNormalRecord}
                  disabled={!!cameraError}
                  className="w-full py-3 rounded-xl bg-[#242428] hover:bg-[#333333] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Circle className="w-4 h-4 fill-rose-500 text-rose-500" />
                  NORMAL KAYDI BAŞLAT
                </button>
              </>
            ) : (
              <>
                <p className="text-[11px] text-[#878792] leading-relaxed">
                  📡 Canlı yayınınız diğer kullanıcılara iletilir. Sürüş hızınız ve telemetriniz ekran üzerinde eşzamanlı gösterilir.
                </p>

                <button
                  onClick={handleStartBroadcast}
                  disabled={!!cameraError}
                  className="w-full py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  CANLI YAYINI BAŞLAT
                </button>
              </>
            )}
          </div>
        )}

        {/* End Stream Button When Live */}
        {isLive && (
          <div className="p-3 bg-white border-t border-[#E5E5EB] flex justify-end">
            <button
              onClick={handleStopBroadcast}
              className="px-4 py-2 rounded-lg bg-[#242428] hover:bg-[#333333] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Yayını Bitir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
