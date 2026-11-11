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
import { RemindersScreen, ReminderForm } from './components/dashboard/RemindersScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { isSupabaseConfigured, signInWithGoogle } from './lib/supabase';
import { parseHash, buildHash } from './lib/navigation';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeSubScreen,
    setActiveSubScreen,
    selectedItemId,
    setSelectedItemId,
    isDataLoading,
    dataError,
    clearDataError,
    isAuthenticated,
    enterDemoMode,
    signIn,
    signUp
  } = useHomeBrain();

  // URL Hash synchronization for browser history & deep linking
  React.useEffect(() => {
    const handleHashChange = () => {
      // Do not process OAuth access tokens in hash
      if (window.location.hash && window.location.hash.includes('=')) return;
      const parsed = parseHash(window.location.hash);
      if (!parsed) return;
      setActiveTab(parsed.tab);
      setActiveSubScreen(parsed.sub);
      if (parsed.itemId !== null) {
        setSelectedItemId(parsed.itemId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveTab, setActiveSubScreen, setSelectedItemId]);

  // Update hash when tab or subscreen changes
  React.useEffect(() => {
    if (window.location.hash && window.location.hash.includes('=')) return;
    const targetHash = buildHash(activeTab, activeSubScreen, selectedItemId);
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  }, [activeTab, activeSubScreen, selectedItemId]);

  if (isSupabaseConfigured && !isAuthenticated) {
    return (
      <AuthScreen
        onSignedIn={signIn}
        onSignedUp={signUp}
        onGoogleSignIn={signInWithGoogle}
        onEnterDemo={enterDemoMode}
      />
    );
  }

  const renderMainContent = () => {
    switch (activeSubScreen) {
      case 'calendar':
        return <CalendarScreen />;
      case 'add-event':
      case 'edit-event':
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
      case 'edit-grocery':
        return <AddGroceryModal />;
      case 'grocery-history':
        return <GroceryHistoryScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'add-reminder':
      case 'edit-reminder':
        return <ReminderForm />;
      case 'medicine':
        return <MedicineManagerScreen />;
      case 'add-medicine':
      case 'edit-medicine':
        return <AddMedicineModal />;
      case 'medicine-history':
        return <MedicineHistoryScreen />;
      case 'expense':
        return <ExpenseDashboardScreen />;
      case 'add-expense':
      case 'edit-expense':
        return <AddExpenseModal />;
      case 'bill-management':
        return <BillManagementScreen />;
      case 'edit-bill':
        return <BillManagementScreen />;
      case 'knowledge':
        return <FamilyKnowledgeScreen />;
      case 'add-knowledge':
      case 'edit-knowledge':
        return <AddKnowledgeModal />;
      case 'emergency':
        return <EmergencyModeModal />;
      case 'add-memory':
      case 'edit-memory':
        return <AddMemoryModal />;
      case 'memory-details':
        return <MemoryDetailsModal />;
      case 'user-profile':
      case 'family-members':
      case 'settings':
      case 'privacy':
        return <ProfileSettingsShell />;

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
          {isDataLoading && (
            <div className="max-w-7xl mx-auto mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              Syncing your family data...
            </div>
          )}
          {dataError && (
            <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between gap-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{dataError}</span>
              <button onClick={clearDataError} className="font-semibold hover:underline">Dismiss</button>
            </div>
          )}
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
