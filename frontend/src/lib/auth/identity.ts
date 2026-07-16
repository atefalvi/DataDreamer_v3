import type { SessionUser } from './session';

const GENERIC_NAMES = new Set(['admin', 'administrator', 'reader', 'user']);

export interface UserIdentity {
  displayName: string;
  firstName?: string;
  initials: string;
  secondary: string;
  providerLabel: string;
  avatarUrl?: string;
}

/** Keep service-role labels and placeholder names out of the learner experience. */
export function userIdentity(user: Pick<SessionUser, 'email' | 'firstName' | 'lastName' | 'provider' | 'avatarUrl' | 'googlePictureUrl'>): UserIdentity {
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();
  const usefulFirstName = firstName && !GENERIC_NAMES.has(firstName.toLowerCase()) ? firstName : undefined;
  const fullName = [usefulFirstName, lastName].filter(Boolean).join(' ');
  const emailName = user.email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  const identitySource = fullName || emailName;
  const displayName = identitySource || 'Data Dreamer member';
  const initials = identitySource
    ? identitySource
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'DD'
    : 'DD';

  return {
    displayName,
    firstName: usefulFirstName,
    initials,
    secondary: user.email || 'Signed in securely',
    providerLabel: user.provider?.toLowerCase() === 'google' ? 'Google connected' : 'Email account',
    avatarUrl: user.avatarUrl || user.googlePictureUrl || undefined,
  };
}
