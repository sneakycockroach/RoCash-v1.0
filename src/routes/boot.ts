import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types.ts';

export const WELCOME_BACK_SESSION_KEY = 'rocash_welcome_back_shown';

/**
 * Boot destination router logic:
 * - no session -> Welcome
 * - session but profile.onboarded_at is null -> Intro
 * - session, onboarded and profile.welcome_back_enabled is true and welcome back has not yet been shown in this browser session -> Welcome back
 * - otherwise -> Home (#/)
 */
export function getBootDestination(
  session: Session | null,
  profile: Profile | null
): string {
  if (!session) {
    return '/welcome';
  }
  if (!profile || !profile.onboarded_at) {
    return '/onboarding/intro';
  }
  const welcomeBackShown = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem(WELCOME_BACK_SESSION_KEY)
    : null;

  if (profile.welcome_back_enabled && !welcomeBackShown) {
    return '/welcome-back';
  }

  return '/';
}
