import { useState, useEffect } from 'react';
import { Settings, X, Save, Mail, Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

export default function HostSettingsModal({ isOpen, onClose }) {
  const [hosts, setHosts] = useState([]);
  const [saving, setSaving] = useState(null);
  const [newHost, setNewHost] = useState({ host_name: '', email: '' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const data = await base44.entities.HostSettings.list();
    setHosts(data);
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const toggleNotification = async (host) => {
    setSaving(host.id);
    await base44.entities.HostSettings.update(host.id, { notifications_enabled: !host.notifications_enabled });
    await load();
    setSaving(null);
  };

  const deleteHost = async (id) => {
    await base44.entities.HostSettings.delete(id);
    await load();
  };

  const addHost = async (e) => {
    e.preventDefault();
    if (!newHost.host_name || !newHost.email) return;
    setAdding(true);
    await base44.entities.HostSettings.create({ ...newHost, notifications_enabled: true });
    setNewHost({ host_name: '', email: '' });
    await load();
    setAdding(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl border-2 border-purple-800/60 overflow-hidden shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d0d1a, #0f0d22)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-800/40 bg-purple-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-700/30 border border-purple-600/30">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.5rem' }}>
                    Host Alert Settings
                  </h2>
                </div>
                <button onClick={onClose} className="text-purple-500 hover:text-purple-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-xs text-slate-500">
                  Hosts listed here will receive an email every time a new quest is submitted to the board.
                </p>

                {/* Existing hosts */}
                <div className="space-y-2">
                  {hosts.length === 0 && (
                    <p className="text-center text-slate-600 text-xs py-4">No hosts configured yet.</p>
                  )}
                  {hosts.map(host => (
                    <div key={host.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-900/20 border border-purple-800/30">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 border border-purple-600/50 flex items-center justify-center text-sm font-black text-purple-200">
                        {host.host_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-100" style={{ fontFamily: "'Caveat', cursive" }}>{host.host_name}</p>
                        <p className="text-xs text-slate-500 truncate">{host.email}</p>
                      </div>
                      <button
                        onClick={() => toggleNotification(host)}
                        disabled={saving === host.id}
                        title={host.notifications_enabled ? 'Notifications ON — click to disable' : 'Notifications OFF — click to enable'}
                        className={`p-1.5 rounded-lg transition-colors ${host.notifications_enabled ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-600 hover:bg-slate-700/30'}`}
                      >
                        {host.notifications_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteHost(host.id)}
                        className="p-1.5 rounded-lg text-red-600/60 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new host */}
                <form onSubmit={addHost} className="space-y-3 pt-2 border-t border-purple-800/30">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Add a Host</p>
                  <div className="flex gap-2">
                    <Input value={newHost.host_name}
                      onChange={e => setNewHost(p => ({ ...p, host_name: e.target.value }))}
                      placeholder="Name (e.g. Nicky)"
                      className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:border-purple-500 text-sm"
                      required />
                    <Input value={newHost.email}
                      onChange={e => setNewHost(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email address"
                      type="email"
                      className="bg-[#0d0820]/70 border-purple-800/50 text-purple-100 placeholder:text-slate-600 focus:border-purple-500 text-sm"
                      required />
                  </div>
                  <Button type="submit" disabled={adding}
                    className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-500/40 text-white text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {adding ? 'Adding...' : 'Add Host'}
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}