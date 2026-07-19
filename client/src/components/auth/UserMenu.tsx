/**
 * UserMenu
 * Shows the signed-in user's Google profile (avatar / name / email) plus a
 * Sign out action. Driven by Firebase Auth (`auth.currentUser`), so it only
 * renders for social (Google/Apple) sign-ins. Renders nothing when Firebase
 * auth is unavailable or no user is signed in.
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { buildInternalPath } from '@/lib/routes';
import { track } from '@/lib/analytics';

export function UserMenu() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) return null;

  const displayName = user.displayName || 'Libre Rider';
  const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

  const handleSignOut = async () => {
    track('header_sign_out');
    try {
      if (auth) await signOut(auth);
    } catch (error) {
      console.error('[UserMenu] Sign out failed:', error);
    } finally {
      // Clear cached app session so the next user starts clean
      localStorage.removeItem('libre_user_id');
      localStorage.removeItem('libre_user_profile');
      window.location.href = buildInternalPath('/');
    }
  };

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="h-9 w-9 rounded-full border border-white/20 object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-medium">
          {initial}
        </div>
      )}

      <div className="hidden text-sm leading-tight md:block">
        <div className="font-medium text-foreground">{displayName}</div>
        {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
      </div>

      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
