import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  Heart,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  Home,
  KeyRound,
  CheckCircle2,
  Share2,
  Copy
} from 'lucide-react';
import { UserRole } from '../../types';

interface AuthScreenProps {
  onSignedIn: (email: string, password: string) => Promise<void>;
  onSignedUp: (
    email: string,
    password: string,
    name: string,
    familyName: string,
    inviteCode?: string,
    relation?: string,
    role?: UserRole,
    mode?: 'create' | 'join'
  ) => Promise<void>;
  onGoogleSignIn?: () => void;
  onEnterDemo?: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  currentUserName?: string;
  currentFamilyName?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignedIn,
  onSignedUp,
  onGoogleSignIn,
  onEnterDemo,
  canGoBack = false,
  onGoBack,
  currentUserName,
  currentFamilyName
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [regMode, setRegMode] = useState<'create' | 'join'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [relation, setRelation] = useState('Father');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect invite code from URL parameters or hash on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromQuery = urlParams.get('code') || urlParams.get('invite') || urlParams.get('join');
      let codeFromHash: string | null = null;
      if (window.location.hash.includes('code=')) {
        const hashQuery = window.location.hash.split('?')[1] || '';
        const hashParams = new URLSearchParams(hashQuery);
        codeFromHash = hashParams.get('code');
      }
      const extractedCode = codeFromQuery || codeFromHash;
      if (extractedCode) {
        setInviteCode(extractedCode.trim().toUpperCase());
        setRegMode('join');
        setIsRegistering(true);
      }
    } catch { }
  }, []);

  const formatAuthError = (err: unknown): string => {
    if (!err) return 'Authentication failed. Please verify your credentials.';
    const raw = err instanceof Error ? err.message : String(err);
    const lower = raw.toLowerCase();

    if (
      lower.includes('incorrect') ||
      lower.includes('invalid login credentials') ||
      lower.includes('invalid_credentials') ||
      lower.includes('invalid_grant') ||
      lower.includes('wrong password')
    ) {
      return 'Incorrect email or password. Please verify your credentials or select a member below.';
    }
    if (lower.includes('user already registered') || lower.includes('already registered')) {
      return 'An account with this email already exists. Please switch to Sign In above.';
    }
    if (lower.includes('password should be at least') || lower.includes('password is too short')) {
      return 'Password is too short. Please use at least 6 characters.';
    }
    if (lower.includes('not found') && lower.includes('invitation')) {
      return 'Family invitation code not found. Please verify the code from your family Admin.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment before trying again.';
    }
    if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('enotfound')) {
      return 'Unable to reach the authentication server. Please check your internet connection.';
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const msg = parsed.msg || parsed.error_description || parsed.message;
        if (msg && typeof msg === 'string') {
          return msg;
        }
      }
    } catch { }

    return raw.replace(/^Sign-in failed \(\d+\):\s*/i, '').replace(/^Registration failed \(\d+\):\s*/i, '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        if (regMode === 'join' && !inviteCode.trim()) {
          setError('Please enter your family invitation code to join.');
          setIsSubmitting(false);
          return;
        }
        await onSignedUp(
          email.trim(),
          password,
          name.trim(),
          familyName.trim() || 'Family Household',
          inviteCode.trim().toUpperCase(),
          relation,
          regMode === 'create' ? 'Admin' : 'Member',
          regMode
        );
      } else {
        await onSignedIn(email.trim(), password);
      }
    } catch (signInError) {
      setError(formatAuthError(signInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo accounts representing separate members of the same household
  const sampleAccounts = [
    { name: 'Sarah', relation: 'Daughter / Admin', email: 'sarah.kumar@homebrain.app', role: 'Admin', icon: '👩‍💼' },
    { name: 'Dad (Rajesh)', relation: 'Father', email: 'dad.rajesh@homebrain.app', role: 'Co-Admin', icon: '👨' },
    { name: 'Mom (Priya)', relation: 'Mother', email: 'mom.priya@homebrain.app', role: 'Co-Admin', icon: '👩' },
    { name: 'Sister (Sneha)', relation: 'Sister', email: 'sister.sneha@homebrain.app', role: 'Member', icon: '👧' },
    { name: 'Brother (Sham)', relation: 'Brother', email: 'brother.sham@homebrain.app', role: 'Member', icon: '👦' }
  ];

  const handleSelectSampleAccount = (acc: typeof sampleAccounts[0]) => {
    setEmail(acc.email);
    setPassword('HomeBrain@2026');
  };

  return (
    <main className="relative h-full h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center bg-family-warm dark:bg-[#080B12] px-4 py-6 sm:py-10 overflow-y-auto text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Ambient Spatial Glowing Light Spheres */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-brand-500/20 rounded-full blur-[130px] animate-float-slow" />
        <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] bg-amber-300/20 rounded-full blur-[130px] animate-float-slow [animation-delay:-4s]" />
        <div className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] bg-brand-200/20 rounded-full blur-[130px] animate-float-slow [animation-delay:-2s]" />
      </div>

      {/* Main Glass Authentication Card */}
      <div className="relative z-10 w-full max-w-lg my-auto shrink-0 bg-[#fffdf7]/95 dark:bg-[#0D1220]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-9 border border-[#eee3c5] dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(122,91,24,0.2)] space-y-4 sm:space-y-5">
        {/* Specular Top Shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent pointer-events-none rounded-t-3xl" />

        {/* Optional Back to Dashboard Pill */}
        {canGoBack && onGoBack && (
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <button
              type="button"
              onClick={onGoBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            {currentUserName && (
              <span className="text-[11px] text-slate-400">
                Active: <strong className="text-slate-900 dark:text-white">{currentUserName}</strong>
              </span>
            )}
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40">
            <img src="/homebrain-logo.jpg" alt="HomeBrain Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              HomeBrain <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">OS</span>
            </h1>
            <p className="text-xs sm:text-sm text-brand-800 dark:text-cyan-300/80 mt-0.5 max-w-xs mx-auto font-medium">
              Multi-User Autonomous Family Management Platform
            </p>
          </div>
        </div>

        {/* Toggle Sign-In / Register Mode Pills */}
        <div className="flex p-1 rounded-2xl bg-brand-50 dark:bg-[#141C2E] border border-brand-100 dark:border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              !isRegistering
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              isRegistering
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Join or Create Family</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/80 text-xs sm:text-sm text-rose-200 flex items-center gap-2.5 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Registration Sub-Mode: Create vs Join Household */}
        {isRegistering && (
          <div className="p-1.5 rounded-2xl bg-brand-100/60 dark:bg-[#101726] border border-brand-200 dark:border-white/10 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setRegMode('create');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                regMode === 'create'
                  ? 'bg-white dark:bg-brand-600 text-brand-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-amber-500" />
              <span>Create New Family</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRegMode('join');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                regMode === 'join'
                  ? 'bg-white dark:bg-brand-600 text-brand-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Join with Invite Code</span>
            </button>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Member Name */}
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Your Name</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="e.g. Dad / Rajesh, Mom / Priya, Sister / Sneha"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none"
              />
            </div>
          )}

          {/* Relationship Selector */}
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Your Relationship in Household</span>
              </label>
              <select
                value={relation}
                onChange={event => setRelation(event.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white font-medium outline-none"
              >
                <option value="Father">Father / Dad</option>
                <option value="Mother">Mother / Mom</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Grandfather">Grandfather / Elder</option>
                <option value="Grandmother">Grandmother / Elder</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Member">Family Member</option>
              </select>
            </div>
          )}

          {/* Create Mode: Household Name */}
          {isRegistering && regMode === 'create' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-500" />
                <span>Household Name</span>
              </label>
              <input
                required
                type="text"
                value={familyName}
                onChange={event => setFamilyName(event.target.value)}
                placeholder="e.g. Kumar Household, Sharma Family"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none"
              />
              <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium pt-0.5">
                ⭐ You will be registered as Family Admin. A secure household invitation code will be generated for Dad, Mom, Sister and Brother.
              </p>
            </div>
          )}

          {/* Join Mode: Family Invitation Code */}
          {isRegistering && regMode === 'join' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Family Invitation Code</span>
                </label>
                <button
                  type="button"
                  onClick={() => setInviteCode('HB-849201')}
                  className="text-[11px] font-semibold text-brand-600 dark:text-cyan-400 hover:underline"
                >
                  Use Sample Code (HB-849201)
                </button>
              </div>
              <input
                required
                type="text"
                value={inviteCode}
                onChange={event => setInviteCode(event.target.value.toUpperCase())}
                placeholder="e.g. HB-849201 or Household UUID"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-brand-300 dark:border-cyan-500/40 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 text-sm font-mono tracking-widest uppercase text-slate-900 dark:text-white placeholder-slate-400 transition-all font-bold outline-none"
              />
              <p className="text-[10px] text-cyan-800 dark:text-cyan-300 font-medium pt-0.5">
                🔗 Enter the code given by your family administrator to sync shared tasks, groceries, expenses, and emergency alerts.
              </p>
            </div>
          )}

          {/* Email Address Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-400" />
              <span>Email Address</span>
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="e.g. dad@homebrain.app"
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none shadow-sm"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter personal password"
                className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-white transition-colors p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Family Account...</span>
              </>
            ) : (
              <>
                <span>
                  {isRegistering
                    ? regMode === 'create'
                      ? 'Create Family Household'
                      : 'Join Family Household'
                    : 'Sign In to HomeBrain'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Family Member Logins for Cross-Device Testing */}
        {!isRegistering && (
          <div className="pt-2 border-t border-[#eadfbe] dark:border-white/5 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
              Multi-Device Family Logins (1-Click Test)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {sampleAccounts.map(acc => (
                <button
                  key={acc.name}
                  type="button"
                  onClick={() => handleSelectSampleAccount(acc)}
                  className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                    email === acc.email
                      ? 'bg-brand-50 dark:bg-brand-900/40 border-brand-500 text-brand-900 dark:text-white ring-1 ring-brand-500'
                      : 'bg-white/60 dark:bg-[#141C2E]/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400'
                  }`}
                >
                  <span className="text-base shrink-0">{acc.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate leading-tight">{acc.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{acc.relation}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Google OAuth Quick Sign-In */}
        {onGoogleSignIn && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border-2 border-[#eadfbe] dark:border-slate-700 hover:border-brand-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>
        )}

        {/* 1-Click Instant Demo Login */}
        {onEnterDemo && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onEnterDemo}
              className="w-full py-2 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore Instant Demo / Agent Account</span>
            </button>
          </div>
        )}

        {/* Security & Multi-Family Isolation Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PostgreSQL Row-Level Security · Multi-Family Data Isolation</span>
        </div>
      </div>
    </main>
  );
};
export default AuthScreen;
