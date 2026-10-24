import { useState } from 'react';
import { LogIn, UserPlus, X, Shield, Lock, Mail, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Field Engineer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.register(name, email, password, role);
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoRole: UserRole, demoName: string) => {
    setEmail(demoEmail);
    setPassword('landslide2026');
    setName(demoName);
    setRole(demoRole);
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Shield className="text-accent" size={22} />
          <h2 className="text-lg font-bold text-white">
            {isRegister ? 'Register Security Credentials' : 'Operator Authentication'}
          </h2>
        </div>

        {/* Preset Operational Role Logins */}
        <div className="mb-4 p-3 rounded-lg bg-navy/60 border border-line text-xs">
          <div className="text-slate-400 mb-2 font-medium">Preset Mission Roles:</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setDemoAccount('nexaraautotechsolution@gmail.com', 'Admin', 'Nexara Admin')}
              className="px-2 py-1 rounded bg-panel border border-accent/60 text-[11px] text-accent hover:border-accent"
            >
              Nexara Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('engineer@landslideguard.ai', 'Field Engineer', 'Sarah Chen')}
              className="px-2 py-1 rounded bg-panel border border-line text-[11px] text-slate-200 hover:border-accent"
            >
              Field Engineer
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('geologist@landslideguard.ai', 'Geologist', 'Dr. Priya Nair')}
              className="px-2 py-1 rounded bg-panel border border-line text-[11px] text-slate-200 hover:border-accent"
            >
              Geologist
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-500/15 border border-red-500/30 p-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Priya Nair"
                  className="w-full rounded border border-line bg-navy py-2 pl-8 pr-3 text-white outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@landslideguard.ai"
                className="w-full rounded border border-line bg-navy py-2 pl-8 pr-3 text-white outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded border border-line bg-navy py-2 pl-8 pr-3 text-white outline-none focus:border-accent"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-300 mb-1">Operational Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full rounded border border-line bg-navy px-3 py-2 text-white outline-none focus:border-accent"
              >
                <option value="Field Engineer">Field Engineer</option>
                <option value="Geologist">Geologist</option>
                <option value="Admin">Admin</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 rounded bg-accent text-navy font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-line text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-accent hover:underline font-medium"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new access account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-accent hover:underline font-medium"
              >
                Register Here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
