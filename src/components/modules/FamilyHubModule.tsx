import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { UserRole, FamilyMember } from '../../types';
import { InitialAvatar } from '../common/InitialAvatar';
import { PageHeader } from '../layout/PageHeader';
import { dedupeMembers } from '../../lib/supabase';
import {
  Users,
  Shield,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Share2,
  Plus,
  Trash2,
  Crown,
  Sparkles,
  ExternalLink,
  MessageSquare,
  UserCheck,
  RefreshCw,
  Home,
  Heart,
  Lock,
  ChevronDown
} from 'lucide-react';

export const FamilyHubModule: React.FC = () => {
  const {
    currentUser,
    familyMembers,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    updateCurrentUser,
    refreshFamilyData
  } = useHomeBrain();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<FamilyMember | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');

  // Invite modal form fields
  const [inviteName, setInviteName] = useState('');
  const [inviteRelation, setInviteRelation] = useState('Sister');
  const [inviteRole, setInviteRole] = useState<UserRole>('Member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  const currentInviteCode = currentUser.inviteCode || 'HB-849201';
  const householdId = currentUser.familyId || 'demo-family-kumar';
  const householdName = currentUser.familyName || 'Family Household';
  const isAdmin = currentUser.role === 'Admin';
  const isCoAdmin = currentUser.role === 'Co-Admin';
  const canManageRoles = isAdmin;
  const canInvite = isAdmin || isCoAdmin;

  const joinUrl = `${window.location.origin}/#/join?code=${currentInviteCode}`;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshFamilyData();
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Live auto-polling every 5 seconds for real-time member discovery across devices
  React.useEffect(() => {
    void handleManualSync();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void refreshFamilyData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch { }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch { }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! Join our HomeBrain family household ("${householdName}") using this invite code: ${currentInviteCode}\n\nJoin directly: ${joinUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    addFamilyMember({
      name: inviteName.trim(),
      relation: inviteRelation,
      avatar: '',
      role: inviteRole,
      phone: invitePhone.trim(),
      email: inviteEmail.trim()
    });

    setInviteName('');
    setInviteEmail('');
    setInvitePhone('');
    setShowInviteModal(false);
  };

  const handleChangeRole = (memberId: string, newRole: UserRole) => {
    updateFamilyMember(memberId, { role: newRole });
    setSelectedMemberToEdit(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Crown className="w-3 h-3 text-amber-500" />
            Admin
          </span>
        );
      case 'Co-Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            Co-Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-700">
            <UserCheck className="w-3 h-3 text-brand-500" />
            {role || 'Member'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Family Hub & Permissions"
        subtitle="Manage your connected family household, individual accounts, invitation codes, and member roles"
      />

      {/* Logged-In User Identity Spotlight Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 text-white shadow-xl shadow-brand-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <InitialAvatar
            name={currentUser.name}
            className="w-14 h-14 text-xl ring-4 ring-white/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black">{currentUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                {currentUser.relation || 'Family Member'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-brand-100 mt-1 flex items-center gap-2">
              <span>{currentUser.email}</span>
              <span>•</span>
              <span className="font-semibold">{householdName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-brand-800 font-extrabold text-xs shadow-md hover:bg-brand-50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Household Invitation & Identity Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0D1220] border border-[#eee3c5] dark:border-white/10 shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-brand-500" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {householdName}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Household ID:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300">{householdId}</span>
            </p>
          </div>

          {/* Invitation Code Display Box */}
          <div className="flex items-center gap-3 bg-brand-50 dark:bg-[#141C2E] p-2.5 px-4 rounded-2xl border border-brand-200 dark:border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Family Invitation Code
              </p>
              <p className="text-lg font-black font-mono tracking-widest text-brand-600 dark:text-cyan-400">
                {currentInviteCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-brand-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              title="Copy Invite Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Share Invitation Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1 min-w-0 bg-slate-50 dark:bg-[#141C2E] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
            {joinUrl}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Join Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Family Members Roster */}
      <div className="space-y-4">
        {(() => {
          const displayedMembers = dedupeMembers(familyMembers);
          return (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-500" />
                    <span>Connected Family Members ({displayedMembers.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All family and friend accounts connected with code <strong className="font-mono text-brand-600 dark:text-amber-400">{currentInviteCode}</strong> are synchronized across devices.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Cloud Synced</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#141C2E] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="Refresh connected members list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-brand-500 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Refresh Roster'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMembers.map(member => {
                  const isSelf = (member.email && currentUser.email && member.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                    member.id === currentUser.id;
            return (
              <div
                key={member.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#0D1220] border ${
                  isSelf
                    ? 'border-brand-400/50 dark:border-brand-500/50 ring-1 ring-brand-500/20'
                    : 'border-[#eee3c5] dark:border-white/10'
                } shadow-card space-y-4 relative group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <InitialAvatar
                      name={member.name}
                      className="w-12 h-12 text-base ring-2 ring-brand-500/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        {isSelf && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {member.relation || 'Member'}
                      </p>
                    </div>
                  </div>
                  <div>{getRoleBadge(member.role)}</div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {member.email && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="text-slate-400">📧</span>
                      <span>{member.email}</span>
                    </p>
                  )}
                  {member.phone && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="text-slate-400">📱</span>
                      <span>{member.phone}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-Time Cloud Synced</span>
                  </p>
                </div>

                {/* Role & Member Controls (Admin only) */}
                {canManageRoles && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={member.role}
                        onChange={e => handleChangeRole(member.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Co-Admin">Co-Admin</option>
                        <option value="Member">Member</option>
                        <option value="Senior">Senior / Elder</option>
                        <option value="Child">Child</option>
                      </select>
                    </div>

                    {!isSelf && familyMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${member.name} from the family household?`)) {
                            removeFamilyMember(member.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  })()}
</div>

      {/* Role & Permissions Matrix Guide */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0D1220] border border-[#eee3c5] dark:border-white/10 shadow-card space-y-4">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-500" />
          <span>Role Permissions & Access Control</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h5 className="font-black text-sm text-slate-900 dark:text-white">Admin</h5>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Full household control & rename</li>
              <li>• Generate & revoke invite codes</li>
              <li>• Promote / demote member roles</li>
              <li>• Remove members from household</li>
              <li>• Manage all shared family records</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h5 className="font-black text-sm text-slate-900 dark:text-white">Co-Admin</h5>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Invite Dad, Mom, or Siblings</li>
              <li>• Add & edit shared tasks & groceries</li>
              <li>• Manage household calendar & expenses</li>
              <li>• Upload documents to shared vault</li>
              <li>• Receive high-priority SOS alerts</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-500" />
              <h5 className="font-black text-sm text-slate-900 dark:text-white">Member</h5>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Private Personal Spaces (Tasks, Expenses)</li>
              <li>• View & mark shared tasks/groceries</li>
              <li>• Trigger personal Emergency SOS</li>
              <li>• Receive family safety notifications</li>
              <li>• View family memories & timeline</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Member / Direct Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0D1220] rounded-3xl p-6 border border-[#eee3c5] dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Add Family Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Dad, Mom, Brother, Sister"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141C2E] text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Relationship
                  </label>
                  <select
                    value={inviteRelation}
                    onChange={e => setInviteRelation(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141C2E] text-xs font-medium"
                  >
                    <option value="Father">Father / Dad</option>
                    <option value="Mother">Mother / Mom</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141C2E] text-xs font-medium"
                  >
                    <option value="Member">Member</option>
                    <option value="Co-Admin">Co-Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Senior">Senior</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email (Optional for registration sync)
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="e.g. brother@homebrain.app"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141C2E] text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone (Optional for SOS SMS)
                </label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={e => setInvitePhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141C2E] text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FamilyHubModule;
