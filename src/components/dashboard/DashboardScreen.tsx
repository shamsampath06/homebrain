import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { ImportantReminders } from './ImportantReminders';
import { CognitiveCommandCenter } from './CognitiveCommandCenter';
import { CalendarCard } from '../modules/CalendarModule';
import { DocumentVaultCard } from '../modules/DocumentVaultModule';
import { GroceryCard } from '../modules/SmartGroceryModule';
import { MedicineCard } from '../modules/MedicineManagerModule';
import { ExpenseCard } from '../modules/ExpenseBillModule';
import { KnowledgeCard } from '../modules/FamilyKnowledgeModule';
import { ShieldAlert, Cpu, LayoutGrid } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { navigateToSubScreen } = useHomeBrain();
  const [dashboardView, setDashboardView] = useState<'command-center' | 'modules'>('command-center');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            System Workspace: {dashboardView === 'command-center' ? 'Autonomous Cognitive Command Center' : 'Standard Household Cards'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setDashboardView('command-center')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              dashboardView === 'command-center'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Cognitive Command Center</span>
          </button>

          <button
            onClick={() => setDashboardView('modules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              dashboardView === 'modules'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Module Cards</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      {dashboardView === 'command-center' ? (
        <div className="space-y-6">
          <CognitiveCommandCenter />

          {/* Emergency Mode Banner Action */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base">Emergency Mode (SOS Network)</h3>
                <p className="text-xs text-rose-100">Send instant real-time GPS coordinates & emergency alerts to all designated family contacts</p>
              </div>
            </div>
            <button
              onClick={() => navigateToSubScreen('emergency')}
              className="px-5 py-2.5 rounded-2xl bg-white text-rose-600 font-extrabold text-xs shadow-md hover:bg-rose-50 transition-colors shrink-0"
            >
              Open Emergency Panel 🚨
            </button>
          </div>

          <ImportantReminders />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Important Reminders Section */}
          <ImportantReminders />

          {/* Emergency Mode Banner Action */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base">Emergency Mode (SOS Network)</h3>
                <p className="text-xs text-rose-100">Send instant location & emergency alerts to family contacts with safety confirmation</p>
              </div>
            </div>
            <button
              onClick={() => navigateToSubScreen('emergency')}
              className="px-5 py-2.5 rounded-2xl bg-white text-rose-600 font-extrabold text-xs shadow-md hover:bg-rose-50 transition-colors shrink-0"
            >
              Open Emergency Panel 🚨
            </button>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CalendarCard />
            <DocumentVaultCard />
            <GroceryCard />
            <MedicineCard />
            <ExpenseCard />
            <KnowledgeCard />
          </div>
        </div>
      )}
    </div>
  );
};
