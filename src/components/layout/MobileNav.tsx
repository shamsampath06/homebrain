import React from 'react';
import { useHomeBrain, MainTab } from '../../context/HomeBrainContext';
import { LayoutDashboard, Bot, Clock, User, ShieldAlert } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, activeSubScreen, setActiveSubScreen } = useHomeBrain();

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'HomeBrain AI', icon: Bot },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'profile', label: 'Settings', icon: User }
  ];

  const handleTabClick = (tab: MainTab) => {
    setActiveTab(tab);
    setActiveSubScreen('none');
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && activeSubScreen === 'none';

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* Emergency SOS Mobile Button */}
        <button
          onClick={() => setActiveSubScreen('emergency')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
            activeSubScreen === 'emergency'
              ? 'text-rose-600 dark:text-rose-400 font-bold'
              : 'text-rose-500 hover:text-rose-600'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-1 animate-pulse" />
          <span className="text-[10px]">SOS</span>
        </button>
      </div>
    </div>
  );
};
