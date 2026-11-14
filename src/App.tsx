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
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { isSupabaseConfigured, signInWithGoogle } from './lib/supabase';
import { parseHash, buildHash } from './lib/navigation';

const AppContent: React.FC = () => {
  const {
    currentUser,
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

  if ((isSupabaseConfigured && !isAuthenticated) || activeSubScreen === 'auth' || activeSubScreen === 'login') {
    return (
      <AuthScreen
        onSignedIn={async (email, password) => {
          await signIn(email, password);
          setActiveSubScreen('none');
        }}
        onSignedUp={async (email, password, name, familyName) => {
          await signUp(email, password, name, familyName);
          setActiveSubScreen('none');
        }}
        onGoogleSignIn={signInWithGoogle}
        onEnterDemo={() => {
          enterDemoMode();
          setActiveSubScreen('none');
        }}
        canGoBack={isAuthenticated}
        onGoBack={() => setActiveSubScreen('none')}
        currentUserName={currentUser?.name}
        currentFamilyName={currentUser?.familyName}
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
    <div className="relative flex h-screen overflow-hidden bg-family-warm text-slate-900 dark:bg-[#080B12] dark:text-slate-100">
      {/* Ambient Animated Depth Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-300/15 dark:bg-brand-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float-slow [animation-delay:-4s]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-brand-200/15 dark:bg-amber-500/5 rounded-full blur-3xl animate-float-slow [animation-delay:-2s]" />
      </div>

      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main App Container */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Dynamic Screen Viewport with Staggered Entrance */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          {isDataLoading && (
            <div className="max-w-7xl mx-auto mb-4 rounded-2xl bg-brand-50/90 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-4 py-3 text-sm text-brand-700 dark:text-brand-300 flex items-center gap-2 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              <span>Syncing live family cognitive data...</span>
            </div>
          )}
          {dataError && (
            <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between gap-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 shadow-sm">
              <span>{dataError}</span>
              <button onClick={clearDataError} className="font-semibold hover:underline">Dismiss</button>
            </div>
          )}
          <div key={`${activeTab}-${activeSubScreen}`} className="animate-fadeIn transition-opacity duration-300">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Spotlight Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal />
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
