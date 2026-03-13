/**
 * Shows a green dot if lastActive is within the last 15 minutes, grey otherwise.
 * Usage: <OnlineDot lastActive={profile.last_active} />
 */
export default function OnlineDot({ lastActive, className = '' }) {
  const isOnline = lastActive
    ? Date.now() - new Date(lastActive).getTime() < 15 * 60 * 1000
    : false;

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full border-2 border-[#0a0518] shrink-0 ${
        isOnline ? 'bg-green-400' : 'bg-slate-600'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}