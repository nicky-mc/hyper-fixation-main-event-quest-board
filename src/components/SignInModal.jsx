import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, Chrome } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SignInModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    // base44 auth uses the platform's login page - redirects there and back
    base44.auth.redirectToLogin('/QuestBoard');
  };

  const handleGoogleSignIn = () => {
    base44.auth.redirectToLogin('/QuestBoard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 6, 24, 0.8)',
        border: '1px solid rgba(239,68,68,0.2)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #dc2626, #fbbf24, #dc2626, transparent)' }} />
      
      <div className="p-8 sm:p-10">
        <h2 className="text-2xl font-black text-amber-300 mb-1 text-center"
          style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', letterSpacing: '0.1em' }}>
          READY PLAYER ONE
        </h2>
        <p className="text-slate-500 text-center text-xs mb-8" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Sign in to your adventurer account
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(30, 20, 50, 0.6)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(30, 20, 50, 0.6)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs text-center font-semibold">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              background: 'radial-gradient(ellipse at 50% 0%, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)',
              boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              color: '#fff',
              letterSpacing: '0.08em',
            }}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SIGNING IN...
              </>
            ) : (
              '⚔️ SIGN IN'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-slate-500" style={{ background: 'rgba(8, 6, 24, 0.8)' }}>or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              background: 'rgba(66,133,244,0.15)',
              border: '1px solid rgba(66,133,244,0.4)',
              boxShadow: '0 0 20px rgba(66,133,244,0.15)',
              color: '#4285f4',
              letterSpacing: '0.08em',
            }}>
            <Chrome className="w-4 h-4" />
            SIGN IN WITH GOOGLE
          </button>
          </form>

          {/* Close hint */}
          <p className="text-center text-slate-600 text-xs mt-4">Press ESC to close</p>
      </div>
    </motion.div>
  );
}