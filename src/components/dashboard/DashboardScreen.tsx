import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { ImportantReminders } from './ImportantReminders';
import { CognitiveCommandCenter } from './CognitiveCommandCenter';
import { HouseholdActivityFeed } from './HouseholdActivityFeed';
import { CalendarCard } from '../modules/CalendarModule';
import { DocumentVaultCard } from '../modules/DocumentVaultModule';
import { GroceryCard } from '../modules/SmartGroceryModule';
import { MedicineCard } from '../modules/MedicineManagerModule';
import { ExpenseCard } from '../modules/ExpenseBillModule';
import { KnowledgeCard } from '../modules/FamilyKnowledgeModule';
import { Users, Pill, CreditCard, ShoppingCart, FileText, Cpu, LayoutGrid, ShieldAlert, Sparkles, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../../lib/display';

export const DashboardScreen: React.FC = () => {
  const {
    familyMembers,
    medicines,
    medicineLogs,
    expenses,
    bills,
    groceries,
    documents,
    navigateToSubScreen,
    dashboardView,
    setDashboardView
  } = useHomeBrain();

  // Summary Metrics calculations
  const totalSpend = expenses.reduce((acc, e) => acc + e.amount, 0);
  const unpaidBills = bills.filter(b => !b.isPaid);
  const pendingGroceries = groceries.filter(g => !g.isPurchased);
  const expiringDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 60;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Household Core Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Family Members */}
        <div
          onClick={() => navigateToSubScreen('family-members')}
          className="spatial-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Household</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {familyMembers.length} Members
            </p>
          </div>
        </div>

        {/* Metric 2: Clinical Adherence */}
        <div
          onClick={() => navigateToSubScreen('medicine')}
          className="spatial-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Prescriptions</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {medicines.length} Active
            </p>
          </div>
        </div>

        {/* Metric 3: Monthly Expenses */}
        <div
          onClick={() => navigateToSubScreen('expense')}
          className="spatial-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses & Bills</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {formatINR(totalSpend)}
            </p>
          </div>
        </div>

        {/* Metric 4: Pantry Depletion */}
        <div
          onClick={() => navigateToSubScreen('grocery')}
          className="spatial-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all group"
        >
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pantry Restock</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {pendingGroceries.length} To Buy
            </p>
          </div>
        </div>

        {/* Metric 5: Document Vault */}
        <div
          onClick={() => navigateToSubScreen('documents')}
          className="spatial-card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 dark:hover:border-brand-600 transition-all group col-span-2 sm:col-span-1"
        >
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Vault</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {documents.length} Records {expiringDocs.length > 0 && <span className="text-xs text-rose-500 font-semibold">• {expiringDocs.length} Alert</span>}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dashboard View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Workspace Mode: {dashboardView === 'command-center' ? 'Autonomous Cognitive Command Center' : 'Standard Household Cards'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
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

      {/* 4. Main Content Area based on View Mode */}
      {dashboardView === 'command-center' ? (
        <div className="space-y-6">
          <CognitiveCommandCenter />

          {/* Household Activity Feed & Reminders Side-by-Side Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HouseholdActivityFeed />
            <ImportantReminders />
          </div>

          {/* Emergency SOS Quick Network Action */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white text-slate-900 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Emergency SOS Network</h3>
                <p className="text-xs text-slate-600">Broadcast instant live GPS coordinates & high-priority emergency alerts to all family contacts</p>
              </div>
            </div>
            <button
              onClick={() => navigateToSubScreen('emergency')}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-md hover:bg-rose-700 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              Open Emergency SOS Panel 🚨
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Feature Cards Grid (Instant Access to All 6 Household Engines) */}
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
export default DashboardScreen;
