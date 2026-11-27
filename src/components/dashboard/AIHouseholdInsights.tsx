import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { Sparkles, Pill, AlertTriangle, AlertCircle, ShoppingCart, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatINR } from '../../lib/display';

export const AIHouseholdInsights: React.FC = () => {
  const { medicines, medicineLogs, bills, expenses, groceries, documents, navigateToSubScreen } = useHomeBrain();

  // 1. Clinical Adherence
  const totalMeds = (medicines || []).length;
  const takenMedsCount = (medicineLogs || []).filter(l => l && l.status === 'Taken').length;
  const adherenceRate = totalMeds > 0 ? Math.min(100, Math.round((takenMedsCount / totalMeds) * 100)) : 100;

  // 2. Unpaid Bills
  const unpaidBills = (bills || []).filter(b => b && !b.isPaid);
  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + (Number(b?.amount) || 0), 0);

  // 3. Depleted Groceries
  const pendingGroceries = (groceries || []).filter(g => g && !g.isPurchased);

  // 4. Expiring Documents
  const expiringDocs = (documents || []).filter(d => {
    if (!d || !d.expiryDate) return false;
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 60;
  });

  return (
    <div className="spatial-card p-6 bg-gradient-to-br from-brand-50/60 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-brand-950/30 border-brand-200/80 dark:border-brand-900/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              AI Household Insights
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                Cognitive Synthesis
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous recommendations synthesized across your family records
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateToSubScreen('none')}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Ask HomeBrain</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Insight 1: Medication Adherence */}
        <div
          onClick={() => navigateToSubScreen('medicine')}
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Pill className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {adherenceRate}% Adherence
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Medication Schedule
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {totalMeds} active prescriptions. {takenMedsCount} doses recorded on schedule.
          </p>
        </div>

        {/* Insight 2: Financial Burn Rate & Bills */}
        <div
          onClick={() => navigateToSubScreen('expense')}
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {unpaidBills.length} Due
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Household Utility Ledger
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {unpaidBills.length > 0
              ? `${formatINR(totalUnpaidAmount)} pending in upcoming bills.`
              : 'All bills settled. Monthly burn rate on track.'}
          </p>
        </div>

        {/* Insight 3: Grocery Velocity */}
        <div
          onClick={() => navigateToSubScreen('grocery')}
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {pendingGroceries.length} To Restock
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Pantry Restock Queue
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {pendingGroceries.length > 0
              ? `${pendingGroceries.slice(0, 2).map(g => g.name).join(', ')} pending purchase.`
              : 'Pantry inventory fully stocked.'}
          </p>
        </div>

        {/* Insight 4: Document Renewals */}
        <div
          onClick={() => navigateToSubScreen('documents')}
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-300 dark:hover:border-brand-600 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-mono font-bold ${expiringDocs.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {expiringDocs.length > 0 ? `${expiringDocs.length} Action` : 'Secured'}
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            Document Vault Status
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {expiringDocs.length > 0
              ? `${expiringDocs[0].title} requires renewal in under 60 days.`
              : `${documents.length} verified family documents encrypted.`}
          </p>
        </div>
      </div>
    </div>
  );
};
export default AIHouseholdInsights;

