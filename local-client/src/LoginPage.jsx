import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

const API_URL = 'https://findit-backend-lnq4.onrender.com';

export default function LoginPage({ onLoginSuccess, onGuestAccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'forgot'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', newPassword: '', role: 'Student' });
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'forgot') {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email, newPassword: authForm.newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password reset failed');

        setSuccessMsg(data.message);
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMsg('');
          setAuthForm({ name: '', email: '', password: '', newPassword: '', role: 'Student' });
        }, 2000);
      } else {
        const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        onLoginSuccess(data.user);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-950 p-8 text-white text-center">
          <div className="inline-flex bg-indigo-600 p-3.5 rounded-2xl shadow-inner mb-3">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome to FindIt</h2>
          <p className="text-xs text-indigo-200 mt-1">Campus Lost and Found Portal</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => { setAuthMode('login'); setAuthError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3.5 text-xs font-bold transition cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setAuthMode('signup'); setAuthError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3.5 text-xs font-bold transition cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {authError && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-medium">
              {authError}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Owen Tinagsa"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            {authMode !== 'forgot' ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); setSuccessMsg(''); }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your new password"
                    value={authForm.newPassword}
                    onChange={(e) => setAuthForm({ ...authForm, newPassword: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading 
                ? 'Processing...' 
                : authMode === 'login' 
                  ? 'Log In to Account' 
                  : authMode === 'signup' 
                    ? 'Register Account' 
                    : 'Reset Password'}
            </button>
          </form>

          {authMode === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
              >
                ← Back to Log In
              </button>
            </div>
          )}

          {/* Continue as Guest */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={onGuestAccess}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer transition"
            >
              <span>Browse Catalog as Guest</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}