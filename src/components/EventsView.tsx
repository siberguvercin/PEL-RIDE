import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Award,
  Check,
  Plus,
  Search,
  Compass
} from 'lucide-react';
import { CyclingEvent } from '../types';
import { socketService } from '../services/socket';
import { EventRegistrationModal } from './EventRegistrationModal';

interface EventsViewProps {
  events: CyclingEvent[];
  onSelectEventLocation: (lat: number, lng: number) => void;
  onGoToChat: (roomId: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  onSelectEventLocation,
  onGoToChat,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<CyclingEvent | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registeredBibs, setRegisteredBibs] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('pel_registered_bibs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const user = socketService.getUser();

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Gran Fondo' | 'Kriteryum' | 'Gravel Yarışı' | 'Brevet' | 'Sosyal Tur'>('Gran Fondo');
  const [newCity, setNewCity] = useState('İstanbul');
  const [newLocation, setNewLocation] = useState('Caddebostan Sahil Parkı');
  const [newDate, setNewDate] = useState('28 Kasım 2026');
  const [newTime, setNewTime] = useState('08:30');
  const [newDistance, setNewDistance] = useState('75');
  const [newElevation, setNewElevation] = useState('650');
  const [newDesc, setNewDesc] = useState('');

  const filteredEvents = events.filter((ev) => {
    const matchCat = selectedCategory === 'all' || ev.category === selectedCategory;
    const matchSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenRegistration = (event: CyclingEvent) => {
    setSelectedEventForRegistration(event);
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationComplete = (event: CyclingEvent, bib: string) => {
    socketService.send({
      type: 'register_event',
      eventId: event.id,
      userId: user.id,
    });
    setRegisteredBibs((prev) => {
      const updated = { ...prev, [event.id]: bib };
      try {
        localStorage.setItem('pel_registered_bibs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUnregister = (event: CyclingEvent) => {
    if (confirm(`"${event.title}" yarış kaydınızı iptal etmek istediğinize emin misiniz?`)) {
      socketService.send({
        type: 'unregister_event',
        eventId: event.id,
        userId: user.id,
      });
      setRegisteredBibs((prev) => {
        const updated = { ...prev };
        delete updated[event.id];
        try {
          localStorage.setItem('pel_registered_bibs', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    socketService.send({
      type: 'create_event',
      title: newTitle.trim(),
      category: newCategory,
      city: newCity,
      location: newLocation,
      date: newDate,
      startTime: newTime,
      distanceKm: parseFloat(newDistance) || 50,
      elevationM: parseInt(newElevation) || 300,
      description: newDesc || 'Resmi bisiklet etkinliği.',
      lat: 41.0082,
      lng: 28.9784,
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full min-w-0 bg-[#F4F5F7] text-[#18181B] overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 space-y-6">
      {/* Events Header */}
      <div className="bg-white border border-[#E2E4E9] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FC4C02] block">
            Resmi Yarış & Etkinlik Takvimi
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] mt-0.5">
            Bisiklet Etkinlikleri
          </h1>
          <p className="text-xs text-[#878792]">
            Gran Fondo, Kriteryum ve tırmanış yarışları
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Etkinlik Ekle</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-[#E5E5EB] shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Tüm Etkinlikler' },
            { id: 'Gran Fondo', label: 'Gran Fondo' },
            { id: 'Kriteryum', label: 'Kriteryum' },
            { id: 'Brevet', label: 'Brevet / Tırmanış' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#FC4C02] text-white shadow-sm'
                  : 'bg-[#F7F7FA] text-[#878792] hover:text-[#242428]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#878792]" />
          <input
            type="text"
            placeholder="Etkinlik veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F7FA] text-xs text-[#242428] pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
          />
        </div>
      </div>

      {/* Events List OR Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-[#E2E4E9] rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-[#F4F5F7] border border-[#E2E4E9] flex items-center justify-center text-[#71717A]">
            <Calendar className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-[#FFF2ED] text-[#FC4C02] font-black text-xs uppercase tracking-wider">
            ŞU ANDA ETKİNLİK YOK
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#242428]">
            Bu kategoride planlanmış aktif etkinlik bulunmuyor
          </h3>
          <p className="text-xs text-[#878792] max-w-md mx-auto leading-relaxed">
            Seçtiğiniz filtreye uygun resmi bisiklet etkinliği henüz eklenmedi. Tüm kategorileri kontrol edebilir veya yeni bir etkinlik oluşturabilirsiniz.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-white text-[#242428] font-bold text-xs border border-[#E5E5EB] hover:bg-[#F4F4F6] transition shadow-sm cursor-pointer"
            >
              Filtreleri Temizle
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FC4C02] text-white font-black text-xs hover:bg-[#E34402] transition shadow-sm cursor-pointer"
            >
              Yeni Etkinlik Oluştur
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const isRegistered = ev.registeredUserIds.includes(user.id);

            return (
              <div
                key={ev.id}
                className="bg-white border border-[#E2E4E9] rounded-xl p-5 flex flex-col justify-between transition-all hover:border-[#FC4C02]/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF2ED] text-[#FC4C02]">
                      {ev.category}
                    </span>
                    <span className="text-[11px] font-mono text-[#878792] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#FC4C02]" />
                      {ev.participantsCount} Kayıtlı Bisikletçi
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#242428] leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#6D6D78] mt-1 line-clamp-2">
                    {ev.description}
                  </p>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F0F0F2] text-xs">
                    <div className="flex items-center gap-1.5 text-[#494950]">
                      <Calendar className="w-3.5 h-3.5 text-[#FC4C02]" />
                      <span>{ev.date} · {ev.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#494950]">
                      <MapPin className="w-3.5 h-3.5 text-[#FC4C02]" />
                      <span className="truncate">{ev.location}, {ev.city}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#F0F0F2] font-mono">
                    <div className="bg-[#F7F7FA] p-2 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-[#878792] block font-sans">
                        YARIŞ MESAFESİ
                      </span>
                      <strong className="text-sm font-bold text-[#242428]">
                        {ev.distanceKm} km
                      </strong>
                    </div>
                    <div className="bg-[#F7F7FA] p-2 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-bold text-[#878792] block font-sans">
                        TOPLAM İRTİFA
                      </span>
                      <strong className="text-sm font-bold text-[#FC4C02]">
                        +{ev.elevationM} m
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Event Actions */}
                <div className="mt-4 pt-3 border-t border-[#F0F0F2] flex items-center gap-2">
                  {isRegistered ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <button
                        onClick={() => handleOpenRegistration(ev)}
                        className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm bg-[#FFF2ED] hover:bg-[#FFE6DC] text-[#FC4C02] border border-[#FC4C02]/30"
                        title="Resmi Yarış Kartını & Göğüs Numaranı Görüntüle"
                      >
                        <Check className="w-4 h-4 text-[#FC4C02]" />
                        <span className="truncate">
                          Kayıtlısınız {registeredBibs[ev.id] ? `(#${registeredBibs[ev.id]})` : '✓'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleUnregister(ev)}
                        className="py-2.5 px-3 rounded-xl font-bold text-[11px] text-[#878792] hover:text-red-600 hover:bg-red-50 border border-[#E5E5EB] transition cursor-pointer"
                        title="Kaydı İptal Et"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenRegistration(ev)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm bg-[#FC4C02] hover:bg-[#E34402] text-white"
                    >
                      <Award className="w-4 h-4" />
                      <span>Etkinliğe Kayıt Ol</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectEventLocation(ev.lat, ev.lng)}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#F4F4F6] text-[#242428] border border-[#E5E5EB] transition shadow-sm cursor-pointer"
                    title="Haritada Başlangıç Noktasını Gör"
                  >
                    <Compass className="w-4 h-4 text-[#FC4C02]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
          <div className="w-full max-w-lg bg-white border border-[#E2E4E9] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-[#E5E5EB] pb-3">
              <h3 className="font-bold text-base text-[#242428]">Yeni Bisiklet Etkinliği Oluştur</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#878792] hover:text-[#242428] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                  Etkinlik Adı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Gran Fondo Marmara Etabı"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2.5 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  >
                    <option value="Gran Fondo">Gran Fondo</option>
                    <option value="Kriteryum">Kriteryum</option>
                    <option value="Gravel Yarışı">Gravel Yarışı</option>
                    <option value="Brevet">Brevet / Tırmanış</option>
                    <option value="Sosyal Tur">Sosyal Tur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                  Buluşma / Başlangıç Konumu
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2.5 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                    Mesafe (km)
                  </label>
                  <input
                    type="number"
                    value={newDistance}
                    onChange={(e) => setNewDistance(e.target.value)}
                    className="w-full bg-[#F7F7FA] text-xs text-[#242428] font-mono px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#878792] uppercase mb-1">
                    İrtifa (m)
                  </label>
                  <input
                    type="number"
                    value={newElevation}
                    onChange={(e) => setNewElevation(e.target.value)}
                    className="w-full bg-[#F7F7FA] text-xs text-[#242428] font-mono px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#878792] uppercase mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Yarış parkuru kuralları ve katılım detayları..."
                  className="w-full bg-[#F7F7FA] text-xs text-[#242428] px-3 py-2 rounded-xl border border-[#E5E5EB] focus:border-[#FC4C02] outline-none h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-black text-xs transition cursor-pointer shadow-sm"
              >
                Etkinliği Yayınla
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Race Registration & Pass Modal */}
      <EventRegistrationModal
        event={selectedEventForRegistration}
        isOpen={isRegistrationModalOpen}
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setSelectedEventForRegistration(null);
        }}
        onRegistrationComplete={handleRegistrationComplete}
      />
      </div>
    </div>
  );
};
