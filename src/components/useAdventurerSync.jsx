import { useEffect, useState, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';

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
    let isMounted = true; // Prevent state updates if component unmounts

    const syncUser = async () => {
      try {
        const authUser = await base44.auth.me();
        
        if (!authUser) {
          if (isMounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // 1. FIRST check by auth_id (The most robust method)
        let profiles = await base44.entities.AdventurerProfile.filter({
          auth_id: authUser.id
        });

        let currentProfile = null;

        if (profiles.length > 0) {
          currentProfile = profiles[0];
        } else {
          // 2. Fallback: check by email if they were created before auth_id was added
          profiles = await base44.entities.AdventurerProfile.filter({
            email: authUser.email
          });

          if (profiles.length > 0) {
             currentProfile = profiles[0];
             // Repair the missing auth_id
             currentProfile = await base44.entities.AdventurerProfile.update(currentProfile.id, {
                auth_id: authUser.id,
                system_user_id: authUser.id
             });
          }
        }

        // 3. If still no profile, create a brand new one
        if (!currentProfile) {
           currentProfile = await base44.entities.AdventurerProfile.create({
            auth_id: authUser.id,
            system_user_id: authUser.id,
            adventurer_name: authUser.full_name || authUser.email.split('@')[0],
            email: authUser.email,
            role: 'user'
          });
        }

        // 4. CRITICAL: Always set the profile to state
        if (isMounted) {
            setProfile(currentProfile);
            setError(null);
        }

      } catch (err) {
        console.error('Adventurer sync error:', err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncUser();

    return () => {
        isMounted = false; // Cleanup
    };
  }, []);

  return { profile, loading, error };
}