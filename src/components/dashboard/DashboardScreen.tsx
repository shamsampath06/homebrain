import React from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { ImportantReminders } from './ImportantReminders';
import { CalendarCard } from '../modules/CalendarModule';
import { DocumentVaultCard } from '../modules/DocumentVaultModule';
import { GroceryCard } from '../modules/SmartGroceryModule';
import { MedicineCard } from '../modules/MedicineManagerModule';
import { ExpenseCard } from '../modules/ExpenseBillModule';
import { KnowledgeCard } from '../modules/FamilyKnowledgeModule';
import { ShieldAlert, Sparkles } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { navigateToSubScreen } = useHomeBrain();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Important Reminders Section */}
      <ImportantReminders />

      {/* Emergency Mode Banner Action */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base">Emergency Mode (SOS)</h3>
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
  );
};
