import React from 'react';
import { HomeBrainProvider, useHomeBrain } from './context/HomeBrainContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { AIChatScreen } from './components/ai/AIChatScreen';
import { FamilyTimelineScreen, AddMemoryModal, MemoryDetailsModal } from './components/modules/FamilyTimelineModule';
import { ProfileSettingsShell } from './components/profile/ProfileSettingsModule';

import { CalendarScreen, AddEventModal, EventDetailsModal } from './components/modules/CalendarModule';
import { DocumentVaultScreen, UploadDocumentModal, DocumentDetailsModal } from './components/modules/DocumentVaultModule';
import { GroceryListScreen, AddGroceryModal, GroceryHistoryScreen } from './components/modules/SmartGroceryModule';
import { MedicineManagerScreen, AddMedicineModal, MedicineHistoryScreen } from './components/modules/MedicineManagerModule';
import { ExpenseDashboardScreen, AddExpenseModal, BillManagementScreen } from './components/modules/ExpenseBillModule';
import { FamilyKnowledgeScreen, AddKnowledgeModal } from './components/modules/FamilyKnowledgeModule';
import { EmergencyModeModal } from './components/modules/EmergencyModeModal';

const AppContent: React.FC = () => {
  const { activeTab, activeSubScreen } = useHomeBrain();

  const renderMainContent = () => {
    switch (activeSubScreen) {
      case 'calendar':
        return <CalendarScreen />;
      case 'add-event':
        return <AddEventModal />;
      case 'event-details':
        return <EventDetailsModal />;
      case 'documents':
        return <DocumentVaultScreen />;
      case 'upload-document':
        return <UploadDocumentModal />;
      case 'document-details':
        return <DocumentDetailsModal />;
      case 'grocery':
        return <GroceryListScreen />;
      case 'add-grocery':
        return <AddGroceryModal />;
      case 'grocery-history':
        return <GroceryHistoryScreen />;
      case 'medicine':
        return <MedicineManagerScreen />;
      case 'add-medicine':
        return <AddMedicineModal />;
      case 'medicine-history':
        return <MedicineHistoryScreen />;
      case 'expense':
        return <ExpenseDashboardScreen />;
      case 'add-expense':
        return <AddExpenseModal />;
      case 'bill-management':
        return <BillManagementScreen />;
      case 'knowledge':
        return <FamilyKnowledgeScreen />;
      case 'add-knowledge':
        return <AddKnowledgeModal />;
      case 'emergency':
        return <EmergencyModeModal />;
      case 'add-memory':
        return <AddMemoryModal />;
      case 'memory-details':
        return <MemoryDetailsModal />;

      default:
        switch (activeTab) {
          case 'dashboard':
            return <DashboardScreen />;
          case 'ai':
            return <AIChatScreen />;
          case 'timeline':
            return <FamilyTimelineScreen />;
          case 'profile':
            return <ProfileSettingsShell />;
          default:
            return <DashboardScreen />;
        }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfbf9] dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
};

export function App() {
  return (
    <HomeBrainProvider>
      <AppContent />
    </HomeBrainProvider>
  );
}

export default App;
