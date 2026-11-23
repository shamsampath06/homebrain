import React from 'react';
import { useHomeBrain, MainTab } from '../../context/HomeBrainContext';
import { LayoutDashboard, Bot, Clock, User, ShieldAlert, LayoutGrid } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, activeSubScreen, setActiveSubScreen, dashboardView, setDashboardView } = useHomeBrain();

  const handleTabClick = (tab: MainTab) => {
    setActiveTab(tab);
    setActiveSubScreen('none');
    if (tab === 'dashboard') {
      setDashboardView('command-center');
    }
  };

  const handleModulesClick = () => {
    setActiveTab('dashboard');
    setActiveSubScreen('none');
    setDashboardView('modules');
  };

  const isCommandActive = activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'command-center';
  const isModulesActive = activeTab === 'dashboard' && activeSubScreen === 'none' && dashboardView === 'modules';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-xl border-t border-[#eee3c5] dark:border-white/10 px-1.5 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Command Center */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            isCommandActive
              ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isCommandActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </button>

        {/* Modules Grid */}
        <button
          onClick={handleModulesClick}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            isModulesActive
              ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isModulesActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Modules</span>
        </button>

        {/* AI Assistant */}
        <button
          onClick={() => handleTabClick('ai')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'ai' && activeSubScreen === 'none'
              ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Bot className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${activeTab === 'ai' && activeSubScreen === 'none' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">AI Chat</span>
        </button>

        {/* Timeline */}
        <button
          onClick={() => handleTabClick('timeline')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'timeline' && activeSubScreen === 'none'
              ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${activeTab === 'timeline' && activeSubScreen === 'none' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Timeline</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'profile' && activeSubScreen === 'none'
              ? 'text-brand-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <User className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${activeTab === 'profile' && activeSubScreen === 'none' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>

        {/* Emergency SOS Mobile Button */}
        <button
          onClick={() => setActiveSubScreen('emergency')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeSubScreen === 'emergency'
              ? 'text-rose-600 dark:text-rose-400 font-black'
              : 'text-rose-500 hover:text-rose-600'
          }`}
        >
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 animate-pulse" />
          <span className="text-[10px] font-black tracking-tight">SOS</span>
        </button>
      </div>
    </div>
  );
};
