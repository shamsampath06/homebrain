import React, { useState } from 'react';

interface AuthScreenProps {
  onSignedIn: (email: string, password: string) => Promise<void>;
  onSignedUp: (email: string, password: string, name: string, familyName: string) => Promise<void>;
  onGoogleSignIn?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignedIn, onSignedUp, onGoogleSignIn }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError(signInError instanceof Error ? signInError.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfbf9] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl">
        <div>
          <p className="text-3xl">🧠</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{isRegistering ? 'Create your HomeBrain account' : 'Sign in to HomeBrain'}</h1>
          <p className="mt-1 text-sm text-slate-500">Use your family account to access private data.</p>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        {isRegistering && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border px-3 py-2.5 text-sm" />}
        {isRegistering && <input required value={familyName} onChange={event => setFamilyName(event.target.value)} placeholder="Family name" className="w-full rounded-xl border px-3 py-2.5 text-sm" />}
        <input
          required
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        <input
          required
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        <button disabled={isSubmitting} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 shadow-md hover:bg-brand-700 transition-colors">
          {isSubmitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
        </button>

        {onGoogleSignIn && (
          <>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Continue with Google Account
            </button>
          </>
        )}

        <button type="button" onClick={() => setIsRegistering(previous => !previous)} className="w-full text-xs font-semibold text-brand-600 hover:underline">
          {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </form>
    </main>
  );
};
