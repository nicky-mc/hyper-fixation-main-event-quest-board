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
    const syncUser = async () => {
      try {
        const authUser = await base44.auth.me();
        if (!authUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Step 1: Look up by email first (handles existing users with no auth_id)
        let profiles = await base44.entities.AdventurerProfile.filter({
          email: authUser.email
        });

        let profile = null;

        if (profiles.length > 0) {
          // Deduplicate if multiple profiles with same email
          if (profiles.length > 1) {
            // Sort by data completeness, keep the most complete one
            profiles.sort((a, b) => {
              const aScore = Object.values(a).filter(v => v && v !== 'user').length;
              const bScore = Object.values(b).filter(v => v && v !== 'user').length;
              return bScore - aScore;
            });
            profile = profiles[0];
            
            // Delete duplicates
            for (let i = 1; i < profiles.length; i++) {
              await base44.entities.AdventurerProfile.delete(profiles[i].id);
            }
          } else {
            profile = profiles[0];
          }

          // Update auth_id if missing or different, but never touch role
          if (profile.auth_id !== authUser.id || profile.system_user_id !== authUser.id) {
            profile = await base44.entities.AdventurerProfile.update(profile.id, {
              auth_id: authUser.id,
              system_user_id: authUser.id,
            });
          }
          setProfile(profile);
        } else {
          // Create new profile with default role
          const newProfile = await base44.entities.AdventurerProfile.create({
            auth_id: authUser.id,
            system_user_id: authUser.id,
            adventurer_name: authUser.full_name || authUser.email.split('@')[0],
            email: authUser.email,
            role: 'user'
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