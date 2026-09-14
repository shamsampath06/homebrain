import React from 'react';
import { useHomeBrain, MainTab } from '../../context/HomeBrainContext';
import { LayoutDashboard, Bot, Clock, User, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeSubScreen, setActiveSubScreen, currentUser } = useHomeBrain();

  const handleTabClick = (tab: MainTab) => {
    setActiveTab(tab);
    setActiveSubScreen('none');
  };

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Household Control Center'
    },
    {
      id: 'ai',
      label: 'HomeBrain AI',
      icon: Bot,
      description: 'Intelligent Family Assistant'
    },
    {
      id: 'timeline',
      label: 'Family Timeline',
      icon: Clock,
      description: 'Memories & Photo Album'
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      icon: User,
      description: 'Members, Privacy & Preferences'
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              HomeBrain <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">OS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Family Operating System</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Navigation
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && activeSubScreen === 'none';

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'}`} />
                <div>
                  <div className="text-sm">{item.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white opacity-100' : 'text-slate-400'}`} />
            </button>
          );
        })}

        {/* Emergency Mode Quick Link */}
        <div className="pt-6">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Safety & Emergency
          </p>
          <button
            onClick={() => setActiveSubScreen('emergency')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 ${
              activeSubScreen === 'emergency'
                ? 'bg-rose-600 text-white font-semibold shadow-lg shadow-rose-600/25'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <div>
              <div className="text-sm font-semibold">Emergency SOS</div>
              <div className="text-[10px] text-rose-500/80 dark:text-rose-400/80">Location Alert & Contacts</div>
            </div>
          </button>
        </div>
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.role} • {currentUser.familyName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
