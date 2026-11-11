import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { UserRole } from '../../types';
import { InitialAvatar } from '../common/InitialAvatar';
import { User, Users, Settings, Shield, Plus, Trash2, Check, Lock, Sun, Moon, LogOut, X, Bell, Download, FileSpreadsheet } from 'lucide-react';

export const ProfileSettingsShell: React.FC = () => {
  const { activeSubScreen, setActiveSubScreen } = useHomeBrain();
  const [currentTab, setCurrentTab] = useState<'profile' | 'members' | 'settings' | 'privacy'>('profile');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          👤 Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal account, connected family members, roles, preferences, and privacy controls
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('profile')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            currentTab === 'profile'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> User Profile
        </button>
        <button
          onClick={() => setCurrentTab('members')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            currentTab === 'members'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Family Members
        </button>
        <button
          onClick={() => setCurrentTab('settings')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            currentTab === 'settings'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" /> Preferences
        </button>
        <button
          onClick={() => setCurrentTab('privacy')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            currentTab === 'privacy'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" /> Privacy & Security
        </button>
      </div>

      {/* Tab Panels */}
      {currentTab === 'profile' && <UserProfilePanel />}
      {currentTab === 'members' && <FamilyMembersPanel />}
      {currentTab === 'settings' && <SettingsPanel />}
      {currentTab === 'privacy' && <PrivacySecurityPanel />}
    </div>
  );
};

const UserProfilePanel: React.FC = () => {
  const { currentUser, updateCurrentUser } = useHomeBrain();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
      <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
        <InitialAvatar name={currentUser.name} className="w-20 h-20 text-2xl ring-4 ring-brand-500/20" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
          <p className="text-xs text-slate-500">{currentUser.role} • {currentUser.familyName}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="pt-4 flex items-center justify-between">
          {saved && <span className="text-xs font-bold text-emerald-600">✓ Profile updated successfully!</span>}
          <button
            type="submit"
            className="ml-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

const FamilyMembersPanel: React.FC = () => {
  const { familyMembers, addFamilyMember, updateFamilyMember, removeFamilyMember, emergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } = useHomeBrain();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [role, setRole] = useState<UserRole>('Member');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPrimary, setContactPrimary] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relation || (!phone.trim() && !email.trim())) return;

    const member = {
      name,
      relation,
      avatar: '',
      role,
      phone,
      email
    };
    if (editingId) updateFamilyMember(editingId, member);
    else addFamilyMember(member);

    setShowAdd(false);
    setEditingId(null);
    setName('');
    setRelation('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Connected Family Members</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Family Member
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Invite New Member</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
            <input type="email" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 rounded-xl border text-xs" />
            <input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} className="px-3 py-2 rounded-xl border text-xs" />
            <input
              type="text"
              placeholder="Relation (e.g. Uncle, Son)"
              required
              value={relation}
              onChange={e => setRelation(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="px-3 py-2 rounded-xl border text-xs">
              <option value="Parent">Parent</option>
              <option value="Senior">Senior / Elder</option>
              <option value="Child">Child / Teen</option>
              <option value="Member">Member</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
            Save Member
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {familyMembers.map(m => (
          <div
            key={m.id}
            className="p-4 rounded-3xl bg-white dark:bg-slate-800 shadow-card border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <InitialAvatar name={m.name} className="w-12 h-12" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</p>
                <p className="text-xs text-slate-500">{m.relation} • Role: <span className="font-semibold text-brand-600">{m.role}</span></p>
                <p className="text-[10px] text-slate-400">{m.phone}</p>
              </div>

              <section className="rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-card border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Emergency Contacts</h3>
                    <p className="text-xs text-slate-500">Contacts available for confirmed emergency alerts.</p>
                  </div>
                  {!editingContactId && <button type="button" onClick={() => { setContactName(''); setContactRelation(''); setContactPhone(''); setContactPrimary(false); setEditingContactId('new'); }} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Add Contact</button>}
                </div>
                {editingContactId && (
                  <form onSubmit={event => {
                    event.preventDefault();
                    if (!contactName.trim() || !contactRelation.trim() || !/^[+0-9][0-9 ()-]{6,}$/.test(contactPhone)) return;
                    const value = { name: contactName.trim(), relation: contactRelation.trim(), phone: contactPhone.trim(), isPrimary: contactPrimary };
                    if (editingContactId === 'new') addEmergencyContact(value);
                    else updateEmergencyContact(editingContactId, value);
                    setEditingContactId(null);
                  }} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input required placeholder="Name" value={contactName} onChange={event => setContactName(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                    <input required placeholder="Relation" value={contactRelation} onChange={event => setContactRelation(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                    <input required type="tel" placeholder="Phone" value={contactPhone} onChange={event => setContactPhone(event.target.value)} className="rounded-xl border px-3 py-2 text-xs" />
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={contactPrimary} onChange={event => setContactPrimary(event.target.checked)} /> Primary</label>
                    <div className="sm:col-span-4 flex gap-2"><button className="rounded-xl bg-rose-600 px-3 py-2 text-xs text-white">Save Contact</button><button type="button" onClick={() => setEditingContactId(null)} className="px-3 py-2 text-xs">Cancel</button></div>
                  </form>
                )}
                {emergencyContacts.length === 0 ? <p className="text-xs text-slate-400">No emergency contacts added.</p> : emergencyContacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between rounded-2xl border p-3">
                    <div><p className="text-sm font-semibold">{contact.name} {contact.isPrimary && <span className="text-[10px] text-rose-600">PRIMARY</span>}</p><p className="text-xs text-slate-500">{contact.relation} · <a className="text-brand-600" href={`tel:${contact.phone}`}>{contact.phone}</a></p></div>
                    <div className="flex gap-2 text-xs"><button onClick={() => { setContactName(contact.name); setContactRelation(contact.relation); setContactPhone(contact.phone); setContactPrimary(contact.isPrimary); setEditingContactId(contact.id); }} className="text-brand-600 hover:underline">Edit</button><button onClick={() => { if (window.confirm(`Delete ${contact.name}?`)) deleteEmergencyContact(contact.id); }} className="text-rose-600 hover:underline">Delete</button></div>
                  </div>
                ))}
              </section>
            </div>

            {familyMembers.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm(`Remove ${m.name} from the family?`)) removeFamilyMember(m.id);
                }}
                className="text-xs text-rose-500 hover:underline"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => {
                setEditingId(m.id);
                setName(m.name);
                setRelation(m.relation);
                setRole(m.role);
                setPhone(m.phone);
                setEmail(m.email);
                setShowAdd(true);
              }}
              className="text-xs text-brand-600 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    events,
    reminders,
    groceries,
    groceryHistory,
    medicines,
    expenses,
    bills,
    knowledgeList,
    memories,
    familyMembers
  } = useHomeBrain();

  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('homebrain_language') || 'English';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('homebrain_language', newLang);
  };

  const handleToggleNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Desktop notifications are not supported in this browser.');
      return;
    }
    if (Notification.permission === 'granted') {
      alert('Notifications are already enabled in your browser settings.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      new Notification('HomeBrain Notifications Enabled', {
        body: 'You will receive timely alerts for medicine doses and emergency notices.'
      });
    } else {
      setNotificationsEnabled(false);
    }
  };

  // Helper to trigger download
  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. JSON Full Export
  const exportAllJSON = () => {
    const householdBackup = {
      exportDate: new Date().toISOString(),
      familyMembers,
      events,
      reminders,
      groceries,
      groceryHistory,
      medicines,
      expenses,
      bills,
      knowledgeList,
      memories
    };
    triggerDownload(
      `homebrain_family_backup_${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(householdBackup, null, 2),
      'application/json'
    );
  };

  // 2. CSV Expenses Export
  const exportExpensesCSV = () => {
    const headers = ['Title', 'Amount (INR)', 'Category', 'Date', 'Payer', 'Description'];
    const rows = expenses.map(e => [
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.category}"`,
      e.date,
      `"${e.payer}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(`homebrain_expenses_${new Date().toISOString().split('T')[0]}.csv`, csvContent, 'text/csv');
  };

  // 3. CSV Groceries Export
  const exportGroceriesCSV = () => {
    const headers = ['Item', 'Quantity', 'Category', 'Status', 'Purchased By', 'Purchased At'];
    const rows = groceries.map(g => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.quantity}"`,
      `"${g.category}"`,
      g.isPurchased ? 'Purchased' : 'Pending',
      `"${g.purchasedBy || ''}"`,
      `"${g.purchasedAt || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(`homebrain_groceries_${new Date().toISOString().split('T')[0]}.csv`, csvContent, 'text/csv');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
      {/* Theme */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">Theme Display Mode</p>
          <p className="text-xs text-slate-500">Toggle between Light mode and Dark mode</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
        </button>
      </div>

      {/* Language */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">Application Language</p>
          <p className="text-xs text-slate-500">Persisted interface language for elder accessibility</p>
        </div>
        <select
          value={language}
          onChange={e => handleLanguageChange(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
        >
          <option value="English">English (US)</option>
          <option value="Hindi">Hindi / हिंदी</option>
          <option value="Spanish">Español</option>
          <option value="Tamil">Tamil / தமிழ்</option>
          <option value="Telugu">Telugu / తెలుగు</option>
        </select>
      </div>

      {/* Push Notifications */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-brand-500" /> Desktop & Push Notifications
          </p>
          <p className="text-xs text-slate-500">Receive alerts for emergency SOS, medicines, and bill due dates</p>
        </div>
        <button
          type="button"
          onClick={handleToggleNotifications}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            notificationsEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              : 'bg-brand-600 text-white shadow-sm'
          }`}
        >
          {notificationsEnabled ? '✓ Enabled' : 'Enable Alerts'}
        </button>
      </div>

      {/* Family Data Exports */}
      <div>
        <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
          <Download className="w-4 h-4 text-brand-500" /> Export Household Data
        </p>
        <p className="text-xs text-slate-500 mb-3">Download offline copies of your family records at any time</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={exportAllJSON}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 text-left transition-all"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white">Full Backup</p>
            <p className="text-[11px] text-slate-400">JSON Archive</p>
          </button>

          <button
            type="button"
            onClick={exportExpensesCSV}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 text-left transition-all"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white">Expenses & Bills</p>
            <p className="text-[11px] text-slate-400">CSV Spreadsheet</p>
          </button>

          <button
            type="button"
            onClick={exportGroceriesCSV}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 text-left transition-all"
          >
            <p className="text-xs font-bold text-slate-900 dark:text-white">Grocery List</p>
            <p className="text-[11px] text-slate-400">CSV Spreadsheet</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const PrivacySecurityPanel: React.FC = () => {
  const { signOut, updatePassword } = useHomeBrain();
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.');
      return;
    }
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Password update failed.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <Lock className="w-4 h-4 text-brand-500" /> Change Account Password
      </h3>

      <form onSubmit={handlePasswordChange} className="space-y-3">
        <input
          type="password"
          placeholder="Current Password"
          required
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border text-xs"
        />
        <input
          type="password"
          placeholder="New Password"
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border text-xs"
        />
        <div className="flex items-center justify-between pt-2">
          {passwordSaved && <span className="text-xs font-bold text-emerald-600">✓ Password updated securely!</span>}
          {passwordError && <span className="text-xs font-semibold text-rose-600">{passwordError}</span>}
          <button type="submit" className="ml-auto px-5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
            Update Password
          </button>
        </div>
      </form>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
};
