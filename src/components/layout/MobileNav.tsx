import React from 'react';
import { useHomeBrain, MainTab } from '../../context/HomeBrainContext';
import { LayoutDashboard, Bot, Clock, User, LayoutGrid, Calendar } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, activeSubScreen, setActiveSubScreen, dashboardView, setDashboardView } = useHomeBrain();

  const handleDashboardClick = () => {
    setActiveTab('dashboard');
    setActiveSubScreen('none');
    setDashboardView('command-center');
  };

  const handleModulesClick = () => {
    setActiveTab('dashboard');
    setActiveSubScreen('none');
    setDashboardView('modules');
  };

  const handleTabClick = (tab: MainTab) => {
    setActiveTab(tab);
    setActiveSubScreen('none');
  };

  const isCommandActive = activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'command-center';
  const isModulesActive = activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'modules';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: isCommandActive,
      onClick: handleDashboardClick
    },
    {
      id: 'modules',
      label: 'Cards',
      icon: LayoutGrid,
      isActive: isModulesActive,
      onClick: handleModulesClick
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      isActive: activeSubScreen === 'calendar' || activeSubScreen === 'add-event' || activeSubScreen === 'edit-event' || activeSubScreen === 'event-details',
      onClick: () => {
        setActiveSubScreen('calendar');
      }
    },
    {
      id: 'ai',
      label: 'HomeBrain AI',
      icon: Bot,
      isActive: activeTab === 'ai' && activeSubScreen === 'none',
      onClick: () => handleTabClick('ai')
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      isActive: activeTab === 'timeline' && activeSubScreen === 'none',
      onClick: () => handleTabClick('timeline')
    },
    {
      id: 'profile',
      label: 'Settings',
      icon: User,
      isActive: activeTab === 'profile' && activeSubScreen === 'none',
      onClick: () => handleTabClick('profile')
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-xl border-t border-[#eee3c5] dark:border-white/10 px-1 py-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all active:scale-95 touch-manipulation ${
                item.isActive
                  ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${item.isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight truncate max-w-[66px] text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
