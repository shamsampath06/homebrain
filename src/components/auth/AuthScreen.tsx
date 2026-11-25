import React, { useState } from 'react';
import { Sparkles, ShieldCheck, ArrowRight, Lock, Mail, User, Heart, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onSignedIn: (email: string, password: string) => Promise<void>;
  onSignedUp: (email: string, password: string, name: string, familyName: string) => Promise<void>;
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return 'Incorrect password. Please verify your email and password, or use the demo login.';
    }
    if (lower.includes('user already registered') || lower.includes('already registered')) {
      return 'An account with this email already exists. Please switch to Sign In above.';
    }
    if (lower.includes('password should be at least') || lower.includes('password is too short')) {
      return 'Password is too short. Please use at least 6 characters.';
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
          if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid_credentials')) {
            return 'Incorrect password. Please verify your email and password, or use the demo login.';
          }
          return msg;
        }
      }
    } catch {}

    return raw.replace(/^Sign-in failed \(\d+\):\s*/i, '').replace(/^Registration failed \(\d+\):\s*/i, '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await onSignedUp(email, password, name, familyName);
      } else {
        await onSignedIn(email, password);
      }
    } catch (signInError) {
      setError(formatAuthError(signInError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('sarah.kumar@homebrain.app');
    setPassword('HomeBrain@2026');
  };

  return (
    <main className="relative h-full h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center bg-family-warm dark:bg-[#080B12] px-4 py-8 sm:py-12 overflow-y-auto text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Ambient Spatial Glowing Light Spheres */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-brand-500/20 rounded-full blur-[130px] animate-float-slow" />
        <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] bg-amber-300/20 rounded-full blur-[130px] animate-float-slow [animation-delay:-4s]" />
        <div className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] bg-brand-200/20 rounded-full blur-[130px] animate-float-slow [animation-delay:-2s]" />
      </div>

      {/* Main Glass Authentication Card */}
      <div className="relative z-10 w-full max-w-lg my-auto shrink-0 bg-[#fffdf7]/95 dark:bg-[#0D1220]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-[#eee3c5] dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(122,91,24,0.2)] space-y-5 sm:space-y-6">
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
                Active:                 <strong className="text-slate-900 dark:text-white">{currentUserName}</strong>
              </span>
            )}
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40">
            <img src="/homebrain-logo.jpg" alt="HomeBrain Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              HomeBrain <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">OS</span>
            </h1>
            <p className="text-xs sm:text-sm text-brand-800 dark:text-cyan-300/80 mt-1 max-w-xs mx-auto font-medium">
              Autonomous Multimodal Cognitive Ecosystem
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
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/80 text-xs sm:text-sm text-rose-200 flex items-center gap-2.5 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>Your Full Name</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="e.g. Sarah"
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none"
              />
            </div>
          )}

          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Family / Household Name</span>
              </label>
              <input
                required
                type="text"
                value={familyName}
                onChange={event => setFamilyName(event.target.value)}
                placeholder="e.g. Family Household"
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none"
              />
            </div>
          )}

          {/* Email Address Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>Email Address</span>
              </label>
              {!isRegistering && (
                <button
                  type="button"
                  onClick={handleFillDemoCredentials}
                  className="text-[11px] font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 underline"
                  title="Autofill demo login credentials"
                >
                  Fill Sample
                </button>
              )}
            </div>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="sarah.kumar@homebrain.app"
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Eye Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your family password"
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-[#141C2E] border-2 border-[#eadfbe] dark:border-slate-700 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 dark:text-slate-400 hover:text-brand-700 dark:hover:text-white transition-colors p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Family Vault...</span>
              </>
            ) : (
              <>
                <span>{isRegistering ? 'Establish Family Ecosystem' : 'Enter HomeBrain'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google OAuth Quick Sign-In */}
        {onGoogleSignIn && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#eadfbe] dark:bg-white/10" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-[#eadfbe] dark:bg-white/10" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#141C2E] hover:bg-brand-50 dark:hover:bg-[#1A243B] border-2 border-[#eadfbe] dark:border-slate-700 hover:border-brand-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          <div className="pt-2 text-center border-t border-[#eadfbe] dark:border-white/5">
            <button
              type="button"
              onClick={onEnterDemo}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explore Instant Demo / Agent Account (Family Workspace)</span>
            </button>
          </div>
        )}

        {/* Security & Encryption Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>End-to-End Encrypted Family Database</span>
        </div>
      </div>
    </main>
  );
};
export default AuthScreen;