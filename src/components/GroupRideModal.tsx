import React, { useState } from 'react';
import { X, KeyRound, Bike } from 'lucide-react';
import { socketService } from '../services/socket';

interface GroupRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRideJoined: (code: string) => void;
}

export const GroupRideModal: React.FC<GroupRideModalProps> = ({
  isOpen,
  onClose,
  onRideJoined
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('Yarın 08:00');
  const [distanceKm, setDistanceKm] = useState('35');
  const [elevationM, setElevationM] = useState('320');
  const [meetingPoint, setMeetingPoint] = useState('Sahil Kafe / Park Girişi');

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    socketService.joinGroupRide(joinCode.trim().toUpperCase());
    onRideJoined(joinCode.trim().toUpperCase());
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    socketService.createGroupRide(
      title.trim(),
      date,
      parseFloat(distanceKm) || 25,
      parseInt(elevationM) || 150,
      meetingPoint,
      41.0082,
      28.9784
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white border border-[#E5E5EB] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5EB]">
          <h2 className="text-sm font-extrabold text-[#242428] flex items-center gap-2">
            <span className="text-[#FC4C02]"><Bike className="w-5 h-5" /></span>
            Grup Sürüşü
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#878792] hover:text-[#242428] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-[#F7F7FA] border-b border-[#E5E5EB] gap-1">
          <button
            onClick={() => setTab('join')}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'join'
                ? 'bg-[#FC4C02] text-white shadow-sm'
                : 'text-[#878792] hover:text-[#242428]'
            }`}
          >
            Koda Katıl
          </button>
          <button
            onClick={() => setTab('create')}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'create'
                ? 'bg-[#FC4C02] text-white shadow-sm'
                : 'text-[#878792] hover:text-[#242428]'
            }`}
          >
            Yeni Sürüş Oluştur
          </button>
        </div>

        {/* Join Tab */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                Grup Sürüş Kodu (5 veya 6 Haneli)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[#878792]" />
                <input
                  type="text"
                  placeholder="Örn: BEL77 veya BOS34"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#F7F7FA] text-sm text-[#242428] font-mono tracking-wider font-bold pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  maxLength={10}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#878792] leading-relaxed">
              Arkadaşınızın veya kulübünüzün paylaştığı kodu girerek gruba katılabilir ve özel grup odasına erişebilirsiniz.
            </p>

            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              Gruba Katıl & Sohbeti Aç
            </button>
          </form>
        )}

        {/* Create Tab */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                Sürüş Adı
              </label>
              <input
                type="text"
                placeholder="Örn: Cumartesi Sabah Kahve Turu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                  Mesafe (km)
                </label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full bg-[#F7F7FA] text-xs text-[#242428] font-mono px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                  İrtifa (m)
                </label>
                <input
                  type="number"
                  value={elevationM}
                  onChange={(e) => setElevationM(e.target.value)}
                  className="w-full bg-[#F7F7FA] text-xs text-[#242428] font-mono px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                Buluşma Noktası & Tarih
              </label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none mb-1.5"
                placeholder="Buluşma yeri"
              />
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                placeholder="Tarih ve saat"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs transition cursor-pointer shadow-sm"
            >
              Grup Sürüşünü Yayınla
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
