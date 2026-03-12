import { useEffect, useState, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';

const ADMIN_EMAIL = 'host@heroesmostepic.com';

export const AdventurerContext = createContext(null);
export const useAdventurer = () => useContext(AdventurerContext);

/**
 * Auto-sync authenticated user to AdventurerProfile.
 * Returns { profile, loading, error }
 */
export function useAdventurerSync() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const authUser = await base44.auth.me();
        if (!authUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Find existing profile by system_user_id
        const existing = await base44.entities.AdventurerProfile.filter({
          system_user_id: authUser.id
        });

        if (existing.length > 0) {
          // Already synced
          setProfile(existing[0]);
        } else {
          // Auto-create profile
          const isAdmin = authUser.email === ADMIN_EMAIL;
          const newProfile = await base44.entities.AdventurerProfile.create({
            system_user_id: authUser.id,
            adventurer_name: authUser.full_name || authUser.email.split('@')[0],
            email: authUser.email,
            role: isAdmin ? 'admin' : 'user'
          });
          setProfile(newProfile);
        }
        setError(null);
      } catch (err) {
        console.error('Adventurer sync error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, []);

  return { profile, loading, error };
}