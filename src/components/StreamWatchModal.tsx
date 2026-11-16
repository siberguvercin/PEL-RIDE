import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Heart,
  Send,
  Activity,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { StreamSession, ChatMessage } from '../types';
import { socketService } from '../services/socket';

interface StreamWatchModalProps {
  stream: StreamSession | null;
  onClose: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  userName: string;
  x: number;
}

export const StreamWatchModal: React.FC<StreamWatchModalProps> = ({ stream, onClose }) => {
  const [currentStream, setCurrentStream] = useState<StreamSession | null>(stream);
  const [frameData, setFrameData] = useState<string | null>(stream?.lastFrame || null);
  const [isWebRtcConnected, setIsWebRtcConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [viewersCount, setViewersCount] = useState(stream?.viewers || 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    setCurrentStream(stream);
    setFrameData(stream?.lastFrame || null);
    setIsWebRtcConnected(false);
    setStreamEnded(false);
    setChatMessages([]);
    if (!stream) return;

    const cleanupPeer = () => {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (_) {}
        pcRef.current = null;
      }
      pendingIceRef.current = [];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    const unOffer = socketService.on('webrtc_offer', async (data) => {
      if (data.streamId !== stream.id || !data.sdp) return;
      cleanupPeer();

      const targetId = data.fromUserId || stream.streamerId;
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        const videoEl = remoteVideoRef.current;
        const remoteStream = event.streams[0];
        if (videoEl && remoteStream) {
          videoEl.srcObject = remoteStream;
          setIsWebRtcConnected(true);
          videoEl.play().catch(() => {
            // Autoplay with audio blocked by browser -> fall back to muted play so user sees live video immediately
            if (remoteVideoRef.current) {
              remoteVideoRef.current.muted = true;
              setIsAudioMuted(true);
              remoteVideoRef.current.play().catch(() => {});
            }
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendWebRtcIce(stream.id, targetId, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsWebRtcConnected(false);
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const queued = [...pendingIceRef.current];
        pendingIceRef.current = [];
        for (const cand of queued) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.sendWebRtcAnswer(stream.id, targetId, answer);
      } catch (err) {
        console.warn('WebRTC spectator answer error:', err);
      }
    });

    const unIce = socketService.on('webrtc_ice', async (data) => {
      if (data.streamId !== stream.id || !data.candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (_) {}
      } else {
        pendingIceRef.current.push(data.candidate);
      }
    });

    const unFrame = socketService.on('stream_relay_frame', (data) => {
      if (data.streamId === stream.id && data.frame) {
        setFrameData(data.frame);
      }
    });

    const unTelemetry = socketService.on('stream_telemetry_update', (data) => {
      if (data.streamId === stream.id && data.telemetry) {
        setCurrentStream((prev) => (prev ? { ...prev, ...data.telemetry } : null));
      }
    });

    const unViewers = socketService.on('stream_viewers_update', (data) => {
      if (data.streamId === stream.id) {
        setViewersCount(data.viewers);
      }
    });

    const unReaction = socketService.on('stream_reaction', (data) => {
      if (data.streamId === stream.id) {
        const reaction: FloatingReaction = {
          id: 'rx-' + Date.now() + '-' + Math.random(),
          emoji: data.emoji || '🔥',
          userName: data.userName || 'İzleyici',
          x: 20 + Math.random() * 60,
        };
        setFloatingReactions((prev) => [...prev.slice(-10), reaction]);
        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 1800);
      }
    });

    const unChat = socketService.on('new_chat_message', (data) => {
      if (data.message && data.message.roomId === stream.id) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev.slice(-30), data.message];
        });
      }
    });

    const unEnd = socketService.on('stream_ended', (data) => {
      if (data.streamId === stream.id) {
        setStreamEnded(true);
        cleanupPeer();
      }
    });

    // Join AFTER registering signaling listeners
    socketService.joinStream(stream.id);

    return () => {
      socketService.leaveStream();
      cleanupPeer();
      unOffer();
      unIce();
      unFrame();
      unTelemetry();
      unViewers();
      unReaction();
      unChat();
      unEnd();
    };
  }, [stream]);

  useEffect(() => {
    if (isWebRtcConnected || !frameData || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (c) {
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      }
    };
    img.src = frameData;
  }, [frameData, isWebRtcConnected]);

  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = nextMuted;
      if (!nextMuted) {
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  };

  const sendReaction = (emoji: string) => {
    if (!currentStream) return;
    socketService.sendStreamReaction(currentStream.id, emoji);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentStream) return;
    socketService.sendChatMessage(chatInput.trim(), currentStream.id);
    setChatInput('');
  };

  if (!stream || !currentStream) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white border border-[#E5E5EB] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Stream Top Bar */}
        <div className="flex items-center justify-between p-3.5 bg-white border-b border-[#E5E5EB]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FC4C02] animate-pulse shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#242428] leading-tight flex items-center gap-2 truncate">
                <span className="truncate">{currentStream.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FFF2ED] text-[#FC4C02] font-extrabold uppercase shrink-0">
                  {isWebRtcConnected ? 'CANLI HD' : 'CANLI'}
                </span>
              </h2>
              <span className="text-xs text-[#878792]">
                Yayıncı: <strong className="text-[#242428]">{currentStream.streamerName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleAudio}
              className="p-1.5 rounded-lg bg-[#F7F7FA] hover:bg-[#EAEAEF] text-[#242428] border border-[#E5E5EB] transition cursor-pointer"
              title={isAudioMuted ? 'Yayının Sesini Aç' : 'Sesi Kapat'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>
            <div className="flex items-center gap-1.5 bg-[#F7F7FA] text-[#FC4C02] px-2.5 py-1 rounded-full text-xs font-bold border border-[#E5E5EB]">
              <Users className="w-3.5 h-3.5" />
              <span>{viewersCount}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#878792] hover:text-[#242428] hover:bg-[#F4F4F6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Video Display (WebRTC live video + audio, with canvas fallback) */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={isAudioMuted}
            className={`w-full h-full object-cover ${isWebRtcConnected ? 'block' : 'hidden'}`}
          />

          {!isWebRtcConnected && (
            frameData ? (
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-full border-2 border-[#FC4C02] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-zinc-300 font-semibold">Canlı WebRTC video & ses bağlantısı kuruluyor...</p>
              </div>
            )
          )}

          {streamEnded && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Radio className="w-10 h-10 text-[#FC4C02]" />
              <p className="text-sm font-black text-white">Bu canlı yayın yayıncı tarafından sonlandırıldı.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-black cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}

          {isWebRtcConnected && isAudioMuted && !streamEnded && (
            <button
              type="button"
              onClick={toggleAudio}
              className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>Sesi Aç</span>
            </button>
          )}

          {/* Floating Reactions on Spectator Screen */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                style={{ left: `${r.x}%`, bottom: '25%' }}
                className="absolute animate-float-reaction text-2xl flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/10"
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] text-white font-semibold">{r.userName}</span>
              </div>
            ))}
          </div>

          {/* Telemetry HUD */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#E5E5EB] shadow-sm">
              <span className="text-[10px] font-bold text-[#FC4C02]">HIZ</span>
              <span className="text-lg font-black font-mono text-[#242428] leading-none">
                {currentStream.speed.toFixed(1)}{' '}
                <small className="text-[10px] font-normal text-[#878792]">km/sa</small>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md border border-[#E5E5EB] text-[#242428] text-[11px] font-mono shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#FC4C02]" />
              <span>{Math.round(currentStream.altitude)} m İrtifa</span>
              <span>•</span>
              <span>{currentStream.distance.toFixed(2)} km</span>
            </div>

            {currentStream.heartRate && currentStream.heartRate > 40 && (
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#E5E5EB] text-[#FC4C02] text-[11px] font-mono shadow-sm">
                <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span className="font-black text-[#242428]">{currentStream.heartRate}</span>
                <span className="text-[9px] text-[#878792]">BPM</span>
              </div>
            )}
          </div>

          {/* Floating Reaction Buttons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
            {[
              { emoji: '🔥', label: 'Alev' },
              { emoji: '🚴', label: 'Bas!' },
              { emoji: '👏', label: 'Tebrik' },
              { emoji: '❤️', label: 'Kalp' },
            ].map((btn) => (
              <button
                key={btn.emoji}
                onClick={() => sendReaction(btn.emoji)}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white active:scale-125 transition backdrop-blur-md border border-[#E5E5EB] flex items-center justify-center text-lg shadow-md cursor-pointer"
                title={btn.label}
              >
                {btn.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Live Chat & Spectator Input */}
        <div className="flex flex-col flex-1 bg-[#F7F7FA] border-t border-[#E5E5EB] min-h-[140px] max-h-48">
          <div className="p-2.5 overflow-y-auto flex-1 space-y-1.5 text-xs">
            {chatMessages.length === 0 ? (
              <div className="text-center text-[#878792] py-2">
                Henüz sohbet mesajı yok. Yayıncıya tebrik veya mesaj iletin!
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className="flex items-baseline gap-1.5 text-xs">
                  <span className="font-bold text-[#FC4C02]">{m.userName}:</span>
                  <span className="text-[#242428]">{m.text}</span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-[#E5E5EB] flex gap-2 bg-white">
            <input
              type="text"
              placeholder="Yayıncıya mesaj yaz..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-lg border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gönder</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
