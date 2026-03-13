import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Eye, EyeOff, Chrome } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SignUpModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign up via base44 auth
      await base44.auth.redirectToLogin(window.location.pathname);

      // Create AdventurerProfile automatically
      await base44.entities.AdventurerProfile.create({
        auth_id: formData.email,
        email: formData.email,
        adventurer_name: formData.name,
        role: 'user',
      });

      onSuccess?.();
      window.location.href = '/QuestBoard';
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    base44.auth.redirectToSignUp(window.location.pathname, { provider: 'google' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 6, 24, 0.8)',
        border: '1px solid rgba(251,191,36,0.2)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, #f97316, #fbbf24, transparent)' }} />
      
      <div className="p-8 sm:p-10">
        <h2 className="text-2xl font-black text-amber-300 mb-1 text-center"
          style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', letterSpacing: '0.1em' }}>
          INSERT COIN
        </h2>
        <p className="text-slate-500 text-center text-xs mb-8" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Create your adventurer account
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="name"
              placeholder="Your adventurer name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(30, 20, 50, 0.6)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
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
              name="password"
              placeholder="Create a password (8+ chars)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
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

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(30, 20, 50, 0.6)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              disabled={loading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs text-center font-semibold">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
            className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              background: 'rgba(251,191,36,0.15)',
              border: '2px solid rgba(251,191,36,0.4)',
              boxShadow: '0 0 20px rgba(251,191,36,0.15)',
              color: '#fbbf24',
              letterSpacing: '0.08em',
            }}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                CREATING ACCOUNT...
              </>
            ) : (
              '📜 JOIN THE BOARD'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-slate-500" style={{ background: 'rgba(8, 6, 24, 0.8)' }}>or</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            SIGN UP WITH GOOGLE
          </button>
          </form>

          {/* Close hint */}
          <p className="text-center text-slate-600 text-xs mt-4">Press ESC to close</p>
      </div>
    </motion.div>
  );
}