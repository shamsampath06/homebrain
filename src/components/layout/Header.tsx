import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { Bell, ShieldAlert, Sun, Moon, Sparkles, User as UserIcon, Search, Command, LogIn } from 'lucide-react';
import { InitialAvatar } from '../common/InitialAvatar';
import { formatIndiaDateTime } from '../../lib/display';

export const Header: React.FC = () => {
  const { currentUser, isDarkMode, toggleDarkMode, reminders, emergencyNotifications, openEmergencyNotification, navigateToSubScreen, activeTab } = useHomeBrain();
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingReminders = reminders.filter(r => !r.completed);
  const activeEmergencyNotifications = emergencyNotifications.filter(notification => notification.status === 'active');
  const recentEmergencyNotifications = emergencyNotifications.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-[#fffdf7]/95 dark:bg-[#080B12]/95 backdrop-blur-2xl border-b border-[#eee3c5] dark:border-white/10 text-slate-900 dark:text-white transition-colors shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between gap-2">
        {/* Greeting & Date */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/homebrain-logo.jpg"
            alt="HomeBrain Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover ring-1 ring-cyan-400/40 shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 font-mono leading-tight">
              <span>{getGreeting()}, {currentUser.name.split(' ')[0]}</span>
              <span className="animate-bounce inline-block">👋</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              {currentDate} • <span className="text-brand-600 dark:text-cyan-400/90 font-medium">Telemetry Active</span>
            </p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Spotlight Command Palette Trigger */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border border-[#eee3c5] dark:border-white/10 hover:border-brand-400 dark:hover:border-cyan-400/40 text-slate-600 dark:text-slate-300 text-xs transition-all duration-200 shadow-sm hover:scale-105"
            title="Press Ctrl+K or Cmd+K to search"
          >
            <Search className="w-3.5 h-3.5 text-brand-600 dark:text-cyan-400" />
            <span className="font-semibold hidden md:inline">Quick Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-[#0A0E17] border border-brand-200 dark:border-white/10 text-[10px] font-mono text-brand-700 dark:text-cyan-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Emergency SOS Quick Button */}
          <button
            onClick={() => navigateToSubScreen('emergency')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all duration-200 transform hover:scale-105 active:scale-95 border border-rose-400/40 shrink-0"
            title="Emergency Mode SOS"
          >
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-white" />
            <span className="hidden sm:inline">SOS Emergency</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 sm:p-2.5 rounded-xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border border-[#eee3c5] dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
          </button>

          {/* Quick Login / Account Switch Screen Trigger */}
          <button
            onClick={() => navigateToSubScreen('login')}
            className="p-1.5 sm:p-2.5 rounded-xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border border-[#eee3c5] dark:border-white/10 text-brand-700 dark:text-cyan-400 hover:text-brand-600 dark:hover:text-cyan-300 transition-colors shrink-0"
            title="Open Sign In / Account Switcher"
          >
            <LogIn className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border border-[#eee3c5] dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingReminders.length + activeEmergencyNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {pendingReminders.length + activeEmergencyNotifications.length}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-brand-500" /> Family Reminders ({pendingReminders.length})
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto px-2 py-1">
                  {recentEmergencyNotifications.map(notification => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => { openEmergencyNotification(notification); setShowNotifications(false); }}
                      className="w-full rounded-xl bg-rose-50 p-2.5 my-1 text-left dark:bg-rose-950/40"
                    >
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300">EMERGENCY SOS ALERT</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{notification.initiatorName} · {notification.address}</p>
                      <p className="text-[10px] text-slate-500">{formatIndiaDateTime(notification.lastLocationAt)} · View live location</p>
                    </button>
                  ))}
                  {pendingReminders.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                      No pending reminders today! 🎉
                    </p>
                  ) : (
                    pendingReminders.map(rem => (
                      <div
                        key={rem.id}
                        className="p-2.5 my-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3"
                      >
                        <span className="text-lg">
                          {rem.category === 'Birthday' ? '🎂' : rem.category === 'Medicine' ? '💊' : rem.category === 'Bill' ? '⚡' : '📌'}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{rem.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {rem.dateTime} • <span className="font-medium text-slate-700 dark:text-slate-300">{rem.assignedMemberName}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Quick Avatar */}
          <button
            onClick={() => navigateToSubScreen('user-profile')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
          >
            <InitialAvatar name={currentUser.name} className="w-9 h-9 ring-2 ring-brand-500/30" />
          </button>
        </div>
      </div>
    </header>
  );
};
