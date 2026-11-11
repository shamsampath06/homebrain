import React, { useState, useMemo } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { seedDemoFamilyData } from '../../lib/demoData';
import {
  Activity,
  Cpu,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Pill,
  ShoppingCart,
  Calendar,
  CreditCard,
  FileText,
  User,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Info,
  Network
} from 'lucide-react';
import { formatINR } from '../../lib/display';

export const CognitiveCommandCenter: React.FC = () => {
  const {
    currentUser,
    familyMembers,
    events,
    reminders,
    documents,
    groceries,
    groceryHistory,
    medicines,
    medicineLogs,
    expenses,
    bills,
    knowledgeList,
    memories,
    refreshFamilyData,
    navigateToSubScreen,
    setActiveTab,
    sendAIMessage
  } = useHomeBrain();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGraphMember, setSelectedGraphMember] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshFamilyData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleQuickCognitiveQuery = async (query: string) => {
    setActiveTab('ai');
    await sendAIMessage(query);
  };

  // --- Analytical Calculations ---
  // 1. Clinical Adherence Rate
  const adherenceMetrics = useMemo(() => {
    if (medicines.length === 0) return { score: 100, takenCount: 0, totalDoses: 0, status: 'Optimal' };
    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = medicineLogs.filter(log => log.timestamp?.startsWith(today));
    const totalScheduled = medicines.length; // baseline daily prescriptions
    const score = totalScheduled > 0 ? Math.min(100, Math.round((todaysLogs.length / totalScheduled) * 100)) : 100;
    const status = score >= 80 ? 'Optimal' : score >= 50 ? 'Caution' : 'Critical';
    return { score, takenCount: todaysLogs.length, totalDoses: totalScheduled, status };
  }, [medicines, medicineLogs]);

  // 2. Household Financial Burn Rate & Unpaid Bills
  const financialMetrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const unpaidBills = bills.filter(b => !b.isPaid);
    const totalUnpaidBills = unpaidBills.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const burnRate = totalExpenses + totalUnpaidBills;

    // Spending by Category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    return { totalExpenses, totalUnpaidBills, unpaidCount: unpaidBills.length, burnRate, categoryTotals };
  }, [expenses, bills]);

  // 3. Grocery Restock Urgency Velocity
  const groceryVelocity = useMemo(() => {
    const pendingItems = groceries.filter(g => !g.isPurchased);
    const purchasedItems = groceries.filter(g => g.isPurchased);
    const criticalRestock = pendingItems.slice(0, 4);
    return {
      pendingCount: pendingItems.length,
      purchasedCount: purchasedItems.length,
      criticalRestock,
      depletionRatio: groceries.length > 0 ? Math.round((pendingItems.length / groceries.length) * 100) : 0
    };
  }, [groceries]);

  // 4. Critical Allergies & Medical Warnings
  const criticalAllergies = useMemo(() => {
    return knowledgeList.filter(
      k => k.category === 'Allergies' || k.category === 'Emergency' || k.importance === 'Critical' || k.title.toLowerCase().includes('allerg')
    );
  }, [knowledgeList]);

  // 5. Member Graph Association Map
  const membersWithData = useMemo(() => {
    const members = familyMembers.length > 0
      ? familyMembers
      : [{ id: currentUser.id || 'default_user', name: currentUser.name || 'Primary User', role: currentUser.role || 'Member' }];

    return members.map(m => {
      const memberMeds = medicines.filter(med => med.personName?.toLowerCase() === m.name.toLowerCase());
      const memberReminders = reminders.filter(r => r.assignedMemberName?.toLowerCase() === m.name.toLowerCase());
      const memberKnowledge = knowledgeList.filter(k => k.relatedMemberName?.toLowerCase() === m.name.toLowerCase());
      const memberDocs = documents.filter(d => d.uploaderName?.toLowerCase() === m.name.toLowerCase());
      return {
        ...m,
        medicines: memberMeds,
        reminders: memberReminders,
        knowledge: memberKnowledge,
        documents: memberDocs,
        totalNodes: memberMeds.length + memberReminders.length + memberKnowledge.length + memberDocs.length
      };
    });
  }, [familyMembers, currentUser, medicines, reminders, knowledgeList, documents]);

  const activeGraphDetails = useMemo(() => {
    if (!selectedGraphMember) return membersWithData[0] || null;
    return membersWithData.find(m => m.id === selectedGraphMember) || membersWithData[0] || null;
  }, [selectedGraphMember, membersWithData]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Telemetry Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-gradient-to-br from-brand-600/30 via-indigo-600/20 to-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                HomeBrain OS v2.0 • Telemetry Active
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Database Synchronization: Live
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Autonomous Cognitive Command Center <Cpu className="w-6 h-6 text-brand-400" />
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Live neural multi-pipeline synthesis cross-referencing clinical schedules, financial burn rates, predictive restock velocity, and household entity graphs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all"
              title="Resynchronize Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
            <button
              onClick={() => handleQuickCognitiveQuery('Run a complete household cognitive diagnostics audit')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Full AI Audit</span>
            </button>
          </div>
        </div>

        {/* Real-time Synapse Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Family Members</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{membersWithData.length} Profiles</p>
            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Connected Entities
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Events & Tasks</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{events.length + reminders.length} Total</p>
            <span className="text-[9px] text-brand-400 font-semibold flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> Calendar & Chores
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Clinical Doses</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{medicines.length} Prescriptions</p>
            <span className={`text-[9px] font-semibold ${adherenceMetrics.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {adherenceMetrics.score}% Adherence
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Burn Rate</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{formatINR(financialMetrics.burnRate)}</p>
            <span className="text-[9px] text-slate-300 font-semibold">
              {financialMetrics.unpaidCount} Pending Bills
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Pantry Urgency</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{groceryVelocity.pendingCount} Items</p>
            <span className={`text-[9px] font-semibold ${groceryVelocity.pendingCount > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {groceryVelocity.depletionRatio}% Depleted
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Vault Records</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{documents.length} Files</p>
            <span className="text-[9px] text-purple-400 font-semibold">
              Indexed OCR / Text
            </span>
          </div>
        </div>
      </div>

      {/* Quick Demo Family Banner if under-populated */}
      {membersWithData.length < 2 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Populate 5-Member Demonstration Family</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Load Rajesh, Sunita, Sarah, Sneha, and Sham with realistic clinical schedules, bills, and grocery data.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (currentUser.familyId) {
                await seedDemoFamilyData(currentUser.familyId, currentUser.email);
                await refreshFamilyData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 shadow-md shadow-purple-600/25 transition-all"
          >
            Load Demo Family
          </button>
        </div>
      )}

      {/* 2. Analytical Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Clinical Adherence & Health Radar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Clinical Compliance Engine</h3>
                  <p className="text-[11px] text-slate-400">Medication adherence & safety tracking</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                adherenceMetrics.score >= 80
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {adherenceMetrics.status}
              </span>
            </div>

            {/* Circular Gauge Representation */}
            <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 flex items-center justify-around">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={adherenceMetrics.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}
                    strokeDasharray={`${adherenceMetrics.score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {adherenceMetrics.score}%
                  </span>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">Daily Score</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Logged: {adherenceMetrics.takenCount} doses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Total: {adherenceMetrics.totalDoses} active</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" /> Updated real-time
                </div>
              </div>
            </div>

            {/* Critical Allergies Warning Banner */}
            {criticalAllergies.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 mb-3 space-y-1">
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Medical Warning ({criticalAllergies.length})
                </p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 line-clamp-2">
                  {criticalAllergies.map(a => `${a.relatedMemberName || 'Member'}: ${a.title}`).join(' • ')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigateToSubScreen('medicine')}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Medicine Manager</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Household Financial Burn Rate & Visual Breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Household Financial Matrix</h3>
                  <p className="text-[11px] text-slate-400">Expenses, bills & burn rate forecast</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-mono font-bold">
                {formatINR(financialMetrics.burnRate)}
              </span>
            </div>

            {/* SVG Visual Spend Bar Chart */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 space-y-3 my-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Logged Expenses</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(financialMetrics.totalExpenses)}</span>
              </div>

              {/* Stacked Percentage Visual Bar */}
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                <div
                  className="bg-brand-500 h-full"
                  style={{ width: `${financialMetrics.burnRate > 0 ? (financialMetrics.totalExpenses / financialMetrics.burnRate) * 100 : 50}%` }}
                  title="Expenses"
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${financialMetrics.burnRate > 0 ? (financialMetrics.totalUnpaidBills / financialMetrics.burnRate) * 100 : 50}%` }}
                  title="Unpaid Bills"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  <span>Spent: {formatINR(financialMetrics.totalExpenses)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Unpaid: {formatINR(financialMetrics.totalUnpaidBills)}</span>
                </div>
              </div>
            </div>

            {/* Category breakdown pills */}
            <div className="space-y-1.5 my-2">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Allocation Sectors</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(financialMetrics.categoryTotals).slice(0, 4).map(([cat, amt]) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-slate-600"
                  >
                    {cat}: {formatINR(amt)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateToSubScreen('expense')}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors mt-2"
          >
            <span>Open Expense & Bills Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Predictive Grocery & Pantry Velocity */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Predictive Pantry Velocity</h3>
                  <p className="text-[11px] text-slate-400">Consumption velocity & restock radar</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                groceryVelocity.pendingCount > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {groceryVelocity.pendingCount} To Restock
              </span>
            </div>

            {/* Critical Restock Queue */}
            <div className="space-y-2 my-2">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Depleted / Restock Queue</p>
              {groceryVelocity.criticalRestock.length > 0 ? (
                <div className="space-y-1.5">
                  {groceryVelocity.criticalRestock.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center text-xs text-emerald-700 dark:text-emerald-300">
                  Pantry is fully stocked! Zero depleted items pending.
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 text-xs flex items-center justify-between text-slate-500">
              <span>Recently Fulfilled:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{groceryVelocity.purchasedCount} items</span>
            </div>
          </div>

          <button
            onClick={() => navigateToSubScreen('grocery')}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors mt-3"
          >
            <span>Open Smart Grocery</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Interactive Family Knowledge Graph Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Interactive Family Knowledge Graph Matrix <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Relational multi-entity topology connecting members to prescriptions, allergies, documents & schedules
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-mono font-semibold">
            {membersWithData.length} Family Entities Mapped
          </span>
        </div>

        {/* Member Entity Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {membersWithData.map(m => {
            const isSelected = activeGraphDetails?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedGraphMember(m.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  <User className="w-3 h-3" />
                </div>
                <span>{m.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {m.totalNodes} nodes
                </span>
              </button>
            );
          })}
        </div>

        {/* Entity Graph Relationship Cards for Selected Member */}
        {activeGraphDetails && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Active Entity Focus: {activeGraphDetails.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  Role: {activeGraphDetails.role || 'Member'}
                </span>
              </div>
              <button
                onClick={() => handleQuickCognitiveQuery(`Provide a complete medical, task, and document profile for ${activeGraphDetails.name}`)}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" /> Analyze with AI →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Node 1: Registered Prescriptions */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Prescriptions ({activeGraphDetails.medicines.length})
                </p>
                {activeGraphDetails.medicines.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    {activeGraphDetails.medicines.map(med => (
                      <li key={med.id} className="truncate">• {med.name} ({med.dosage})</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No prescriptions assigned</p>
                )}
              </div>

              {/* Node 2: Critical Health & Knowledge */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Health & Allergies ({activeGraphDetails.knowledge.length})
                </p>
                {activeGraphDetails.knowledge.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    {activeGraphDetails.knowledge.map(k => (
                      <li key={k.id} className="truncate">• {k.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No medical warnings registered</p>
                )}
              </div>

              {/* Node 3: Assigned Reminders & Chores */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Reminders ({activeGraphDetails.reminders.length})
                </p>
                {activeGraphDetails.reminders.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    {activeGraphDetails.reminders.map(r => (
                      <li key={r.id} className="truncate">• {r.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No active reminders</p>
                )}
              </div>

              {/* Node 4: Attached Vault Documents */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Vault Documents ({activeGraphDetails.documents.length})
                </p>
                {activeGraphDetails.documents.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    {activeGraphDetails.documents.map(d => (
                      <li key={d.id} className="truncate">• {d.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No documents tagged</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. One-Click Cognitive Action Prompts */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-300" />
          <h3 className="font-extrabold text-sm uppercase tracking-wide">
            Autonomous Multi-Agent Quick Executions
          </h3>
        </div>
        <p className="text-xs text-brand-100">
          Trigger autonomous agents to cross-examine household records, execute mutations, or analyze compliance in one click.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => handleQuickCognitiveQuery('Analyze household clinical compliance and identify any missed doses for today')}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition-all text-xs font-semibold"
          >
            💊 Audit Clinical Adherence
            <p className="text-[10px] text-brand-200 font-normal mt-0.5">Check missed doses & schedules</p>
          </button>

          <button
            onClick={() => handleQuickCognitiveQuery('Audit monthly household burn rate, expenses vs upcoming bills, and calculate savings')}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition-all text-xs font-semibold"
          >
            💳 Financial Burn Rate Audit
            <p className="text-[10px] text-brand-200 font-normal mt-0.5">Expense velocity & unpaid bills</p>
          </button>

          <button
            onClick={() => handleQuickCognitiveQuery('Predict grocery restock dates and list items that are currently depleted')}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition-all text-xs font-semibold"
          >
            🛒 Generate Restock Matrix
            <p className="text-[10px] text-brand-200 font-normal mt-0.5">Pantry depletion velocity</p>
          </button>

          <button
            onClick={() => handleQuickCognitiveQuery('Check for critical allergies or health warnings across all family records')}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-left transition-all text-xs font-semibold"
          >
            ⚠️ Medical Safety Audit
            <p className="text-[10px] text-brand-200 font-normal mt-0.5">Scan allergies & emergency rules</p>
          </button>
        </div>
      </div>
    </div>
  );
};
