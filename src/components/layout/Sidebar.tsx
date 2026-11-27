import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { LayoutDashboard, Bot, Clock, User, ShieldAlert, ChevronRight, LogIn, LayoutGrid, Users, Calendar } from 'lucide-react';
import { InitialAvatar } from '../common/InitialAvatar';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeSubScreen,
    setActiveSubScreen,
    currentUser,
    dashboardView,
    setDashboardView
  } = useHomeBrain();

  interface NavItemConfig {
    key: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    description: string;
    onClick: () => void;
    isActive: boolean;
  }

  const navItems: NavItemConfig[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Household Control Center',
      onClick: () => {
        setActiveTab('dashboard');
        setActiveSubScreen('none');
        setDashboardView('command-center');
      },
      isActive: activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'command-center'
    },
    {
      key: 'modules',
      label: 'Module Cards',
      icon: LayoutGrid,
      description: 'Household Application Grid',
      onClick: () => {
        setActiveTab('dashboard');
        setActiveSubScreen('none');
        setDashboardView('modules');
      },
      isActive: activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'modules'
    },
    {
      key: 'calendar',
      label: 'Family Calendar',
      icon: Calendar,
      description: 'Schedules, RSVPs & AI',
      onClick: () => {
        setActiveSubScreen('calendar');
      },
      isActive: activeSubScreen === 'calendar' || activeSubScreen === 'add-event' || activeSubScreen === 'edit-event' || activeSubScreen === 'event-details'
    },
    {
      key: 'ai',
      label: 'HomeBrain AI',
      icon: Bot,
      description: 'Intelligent Family Assistant',
      onClick: () => {
        setActiveTab('ai');
        setActiveSubScreen('none');
      },
      isActive: activeTab === 'ai' && activeSubScreen === 'none'
    },
    {
      key: 'timeline',
      label: 'Family Timeline',
      icon: Clock,
      description: 'Memories & Photo Album',
      onClick: () => {
        setActiveTab('timeline');
        setActiveSubScreen('none');
      },
      isActive: activeTab === 'timeline' && activeSubScreen === 'none'
    },
    {
      key: 'family-hub',
      label: 'Family Hub',
      icon: Users,
      description: 'Household Members & Roles',
      onClick: () => {
        setActiveSubScreen('family-hub');
      },
      isActive: activeSubScreen === 'family-hub'
    },
    {
      key: 'profile',
      label: 'Profile & Settings',
      icon: User,
      description: 'Members, Privacy & Preferences',
      onClick: () => {
        setActiveTab('profile');
        setActiveSubScreen('none');
      },
      isActive: activeTab === 'profile' && activeSubScreen === 'none'
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#fffdf7]/95 dark:bg-[#080B12]/95 backdrop-blur-2xl border-r border-[#eee3c5] dark:border-white/10 shrink-0 h-screen sticky top-0 transition-colors text-slate-900 dark:text-slate-100 z-20">
      {/* Specular Edge Line */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

      {/* Brand Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/homebrain-logo.jpg"
            alt="HomeBrain Logo"
            className="w-10 h-10 rounded-2xl object-cover ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-500/20 shrink-0"
          />
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              HomeBrain <span className="text-[10px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">OS</span>
            </h2>
            <p className="text-[10px] font-mono tracking-tight text-cyan-300/80">Cognitive Ecosystem</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          Navigation
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(12,147,231,0.4)] font-bold border border-cyan-400/40 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-[#141C2E] hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-brand-200 dark:hover:border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <div>
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-cyan-100 font-medium' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white opacity-100' : 'text-slate-500'}`} />
            </button>
          );
        })}

        {/* Safety & Defense Quick Link */}
        <div className="pt-4">
          <p className="px-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Safety & Defense
          </p>
          <button
            onClick={() => setActiveSubScreen('emergency')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 ${
              activeSubScreen === 'emergency'
                ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] font-bold border border-rose-400/40'
                : 'text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 border border-transparent hover:border-rose-500/20'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            <div>
              <div className="text-sm font-bold text-rose-400">Emergency SOS</div>
              <div className="text-[10px] text-slate-400">Location Alert & Hotline</div>
            </div>
          </button>
        </div>
      </nav>

      {/* User Session Profile Dock */}
      <div className="p-4 border-t border-[#eee3c5] dark:border-white/10 space-y-2.5 bg-[#fbf7ec]/70 dark:bg-[#0A0E17]/60">
        <div
          onClick={() => setActiveSubScreen('user-profile')}
          className="p-3 rounded-2xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] transition-colors cursor-pointer border border-[#eee3c5] dark:border-white/10 flex items-center justify-between shadow-sm group"
          title="Open User Profile"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <InitialAvatar name={currentUser?.name || 'User'} className="w-8 h-8 text-xs shrink-0 ring-1 ring-cyan-400/40" />
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-cyan-300 transition-colors">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.relation || 'Member'} • <span className="text-brand-600 dark:text-cyan-400 font-bold">{currentUser?.role || 'Member'}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-white transition-colors" />
        </div>

        {/* Dedicated Switch Account / Login Screen Button */}
        <button
          onClick={() => setActiveSubScreen('login')}
          className="w-full py-2.5 px-3 rounded-xl bg-[#101627] hover:bg-brand-600/20 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          title="Open Login Screen to switch accounts or view credentials"
        >
          <LogIn className="w-3.5 h-3.5 text-cyan-400" />
          <span>Switch Account / Sign In</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
