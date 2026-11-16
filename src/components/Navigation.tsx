import React from 'react';
import {
  Home,
  Map as MapIcon,
  CircleDot,
  MessageSquare,
  User,
  Film,
  ShoppingBag
} from 'lucide-react';

export type TabType = 'home' | 'map' | 'reels' | 'ride' | 'market' | 'events' | 'chat' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeStreamsCount: number;
  unreadChatCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeStreamsCount,
  unreadChatCount = 0
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Ana Sayfa', icon: Home },
    { id: 'map' as TabType, label: 'Harita', icon: MapIcon },
    { id: 'reels' as TabType, label: 'Reels', icon: Film },
    { id: 'ride' as TabType, label: 'Sürüş Kaydet', icon: CircleDot, isRecord: true },
    { id: 'market' as TabType, label: 'Pazar', icon: ShoppingBag },
    { id: 'chat' as TabType, label: 'Sohbet', icon: MessageSquare },
    { id: 'profile' as TabType, label: 'Profil', icon: User },
  ];

  return (
    <nav className="bg-white border-t border-[#E2E4E9] sticky bottom-0 z-40 w-full max-w-full px-2 sm:px-6 py-1.5 flex items-center justify-around gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isRecord) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[46px] min-w-[72px] sm:min-w-[88px] px-3 py-1 rounded-lg transition cursor-pointer ${
                isActive
                  ? 'bg-[#FC4C02] text-white'
                  : 'bg-[#FFF4EE] hover:bg-[#FFE8DC] text-[#FC4C02] border border-[#FCD5C3]'
              }`}
              title="Kamerasız GPS Sürüş Kaydet"
            >
              <Icon className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center min-h-[46px] min-w-[44px] sm:min-w-[68px] px-2 sm:px-3 py-1 rounded-lg transition relative cursor-pointer ${
              isActive
                ? 'text-[#FC4C02] font-bold'
                : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F5F7]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-[18px] h-[18px]" />
              {tab.id === 'home' && activeStreamsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] absolute -top-0.5 -right-1" />
              )}
              {tab.id === 'chat' && unreadChatCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#FC4C02] text-white text-[9px] font-bold flex items-center justify-center absolute -top-1.5 -right-2.5">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
