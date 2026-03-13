import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAdventurer } from '@/layout.jsx';
import { Users } from 'lucide-react';

export default function FriendsList() {
  const profile = useAdventurer();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadFriends(profile);
  }, [profile]);

  const loadFriends = async (prof) => {
    setLoading(true);

    // Query using profile.id (database ID), not auth_id
    const [sent, received] = await Promise.all([
      base44.entities.Friendship.filter({ requester_id: prof.id, status: 'accepted' }),
      base44.entities.Friendship.filter({ recipient_id: prof.id, status: 'accepted' }),
    ]);

    const all = [...sent, ...received];

    // Collect the friend's profile IDs
    const friendIds = all.map(f =>
      f.requester_id === prof.id ? f.recipient_id : f.requester_id
    );

    if (friendIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for each friend
    const allProfiles = await base44.entities.AdventurerProfile.list('-created_date', 200);
    const profileMap = {};
    allProfiles.forEach(p => { profileMap[p.id] = p; });

    const friendProfiles = friendIds.map(id => profileMap[id]).filter(Boolean);
    setFriends(friendProfiles);
    setLoading(false);
  };

  if (!profile) {
    return <p className="text-slate-400 text-sm">Loading Adventurer Data...</p>;
  }

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading Adventurer Data...</p>;
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
        <Users className="w-8 h-8 opacity-30" />
        <p className="text-sm">No friends yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {friends.map(f => (
        <li key={f.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(15,8,35,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-white text-sm bg-gradient-to-br from-purple-600 to-blue-900">
            {f.avatar_url
              ? <img src={f.avatar_url} alt={f.adventurer_name} className="w-full h-full object-cover" />
              : (f.adventurer_name || '?').charAt(0).toUpperCase()
            }
          </div>
          <span className="text-sm font-semibold text-purple-100">{f.adventurer_name}</span>
        </li>
      ))}
    </ul>
  );
}