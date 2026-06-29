import { useState } from 'react';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, Fingerprint, UserCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, enableGuestMode } = useStore();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
        // No need to call login after signup - signup already authenticates!
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    enableGuestMode();
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f2f2f2] dark:bg-[#1c1c1c]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1c1c1c] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[#086dd6] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-[#086dd6] blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#086dd6] flex items-center justify-center shadow-lg shadow-[#086dd6]/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">OP Notes</h1>
          <p className="text-lg text-[#999] mb-2">Open Source Notes</p>
          <p className="text-sm text-[#666] max-w-sm mx-auto">
            Privacy-first, end-to-end encrypted note-taking. Your thoughts, your control, your data.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#666]">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#086dd6]" />
              <span>Zero Knowledge</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#086dd6]" />
              <span>E2E Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#086dd6] flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1c1c1c] dark:text-white">OP Notes</h1>
            <p className="text-sm text-[#6B6B6B] dark:text-[#999]">Open Source Notes</p>
          </div>

          <div className="bg-white dark:bg-[#252525] rounded-2xl shadow-sm border border-[#e5e5e5] dark:border-[#3d3d3d] p-6">
            <h2 className="text-xl font-semibold text-[#1c1c1c] dark:text-white mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-[#6B6B6B] dark:text-[#999] mb-6">
              {mode === 'signin'
                ? 'Sign in to access your encrypted notes'
                : 'Start your secure note-taking journey'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-[#1c1c1c] dark:text-white mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 bg-[#f2f2f2] dark:bg-[#1e1e1e] border rounded-lg text-sm text-[#1c1c1c] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#086dd6] transition-colors',
                        errors.displayName ? 'border-[#ef4444]' : 'border-[#e5e5e5] dark:border-[#3d3d3d]'
                      )}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-1 text-xs text-[#ef4444]">{errors.displayName}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1c1c1c] dark:text-white mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 bg-[#f2f2f2] dark:bg-[#1e1e1e] border rounded-lg text-sm text-[#1c1c1c] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#086dd6] transition-colors',
                      errors.email ? 'border-[#ef4444]' : 'border-[#e5e5e5] dark:border-[#3d3d3d]'
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[#ef4444]">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1c1c1c] dark:text-white mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 bg-[#f2f2f2] dark:bg-[#1e1e1e] border rounded-lg text-sm text-[#1c1c1c] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#086dd6] transition-colors',
                      errors.password ? 'border-[#ef4444]' : 'border-[#e5e5e5] dark:border-[#3d3d3d]'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#6B6B6B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#ef4444]">{errors.password}</p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-[#1c1c1c] dark:text-white mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 bg-[#f2f2f2] dark:bg-[#1e1e1e] border rounded-lg text-sm text-[#1c1c1c] dark:text-white placeholder:text-[#999] focus:outline-none focus:border-[#086dd6] transition-colors',
                        errors.confirmPassword ? 'border-[#ef4444]' : 'border-[#e5e5e5] dark:border-[#3d3d3d]'
                      )}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-[#ef4444]">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#086dd6] hover:bg-[#0756b5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e5e5] dark:border-[#3d3d3d]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-[#252525] text-[#999]">or</span>
              </div>
            </div>

            {/* Guest Mode Button */}
            <button
              onClick={handleGuestMode}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[#086dd6] text-[#086dd6] hover:bg-[#086dd6]/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              <UserCircle className="w-4 h-4" />
              Continue without account
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={switchMode}
                className="text-sm text-[#6B6B6B] dark:text-[#999] hover:text-[#086dd6] transition-colors"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-4 p-3 bg-[#f2f2f2] dark:bg-[#1e1e1e] rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#086dd6] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B6B6B] dark:text-[#999]">
                  Your password is hashed with SHA-256 and never stored in plaintext. All notes are encrypted locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}