import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { Bell, ShieldAlert, Sun, Moon, Sparkles, User as UserIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, isDarkMode, toggleDarkMode, reminders, navigateToSubScreen, activeTab } = useHomeBrain();
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingReminders = reminders.filter(r => !r.completed);

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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Greeting & Date */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {getGreeting()}, {currentUser.name.split(' ')[0]} <span className="animate-bounce inline-block">👋</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                <Sparkles className="w-3 h-3 text-brand-500" />
                {currentUser.familyName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {currentDate} • <span className="text-slate-700 dark:text-slate-300 font-medium">Here's what's happening with your family today.</span>
            </p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Emergency SOS Quick Button */}
          <button
            onClick={() => navigateToSubScreen('emergency')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="Emergency Mode SOS"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">SOS Emergency</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingReminders.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {pendingReminders.length}
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
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/30"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
