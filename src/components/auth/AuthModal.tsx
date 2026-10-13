import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
  initialMode?: 'signup' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [name, setName] = useState<string>('Alex Johnson');
  const [email, setEmail] = useState<string>('alex.johnson@example.com');
  const [password, setPassword] = useState<string>('••••••••');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess(name.trim() || 'Patient', email.trim());
    }, 450);
  };

  const handleQuickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess('Alex Johnson', 'alex.demo@kinetiq.health');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-md animate-fade-in">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xl animate-scale-up overflow-hidden">
        {/* Subtle decorative gradient background blur */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand & Title */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold tracking-wide border border-emerald-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>AI Bio-Kinematics Clinic</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 font-heading">
            {mode === 'signup' ? 'Create Your Health Profile' : 'Welcome Back to KinetiQ'}
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            {mode === 'signup'
              ? 'Join thousands restoring pain-free mobility with real-time pose tracking.'
              : 'Sign in to resume your prescribed physiotherapy routines and metrics.'}
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex p-1 bg-stone-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-slide-down">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-stone-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alex Johnson"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/60 focus:bg-white transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-stone-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/60 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-stone-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/60 focus:bg-white transition-all"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="animate-pulse">Configuring Clinical Profile...</span>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Start Clinical Intake Form' : 'Continue to Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-stone-400 text-[11px] font-medium uppercase tracking-wider">
              Or Instant Demo
            </span>
          </div>
        </div>

        {/* 1-Click Demo Patient Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Continue as Demo Patient (Alex Johnson)</span>
        </button>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 text-center">
          <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
          <span>Local browser CV • No video data is uploaded</span>
        </div>
      </div>
    </div>
  );
};
