import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { UserRole } from '../../types';
import { User, Users, Settings, Shield, Plus, Trash2, Check, Lock, Sun, Moon, LogOut, X } from 'lucide-react';

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
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-20 h-20 rounded-full object-cover ring-4 ring-brand-500/20"
        />
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
  const { familyMembers, addFamilyMember, removeFamilyMember } = useHomeBrain();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [role, setRole] = useState<UserRole>('Member');
  const [phone, setPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relation) return;

    addFamilyMember({
      name,
      relation,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role,
      phone: phone || '+1 (555) 000-1122',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@family.homebrain`
    });

    setShowAdd(false);
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
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
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
              <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</p>
                <p className="text-xs text-slate-500">{m.relation} • Role: <span className="font-semibold text-brand-600">{m.role}</span></p>
                <p className="text-[10px] text-slate-400">{m.phone}</p>
              </div>
            </div>

            {familyMembers.length > 1 && (
              <button
                onClick={() => removeFamilyMember(m.id)}
                className="text-xs text-rose-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useHomeBrain();
  const [language, setLanguage] = useState('English');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
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

      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">Application Language</p>
          <p className="text-xs text-slate-500">Select interface language for elder accessibility</p>
        </div>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold"
        >
          <option value="English">English (US)</option>
          <option value="Spanish">Español</option>
          <option value="Hindi">Hindi / हिंदी</option>
        </select>
      </div>
    </div>
  );
};

const PrivacySecurityPanel: React.FC = () => {
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
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
          className="w-full px-3.5 py-2 rounded-xl border text-xs"
        />
        <input
          type="password"
          placeholder="New Password"
          required
          className="w-full px-3.5 py-2 rounded-xl border text-xs"
        />
        <div className="flex items-center justify-between pt-2">
          {passwordSaved && <span className="text-xs font-bold text-emerald-600">✓ Password updated securely!</span>}
          <button type="submit" className="ml-auto px-5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};
