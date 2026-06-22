import { describe, expect, it } from 'vitest';
import { userIdentity } from '../identity';

describe('userIdentity', () => {
  it('uses a real profile name and avatar', () => {
    expect(userIdentity({
      email: 'maria@example.com',
      firstName: 'Maria',
      lastName: 'Khan',
      avatarUrl: 'https://api.example.com/assets/avatar',
    })).toEqual({
      displayName: 'Maria Khan',
      firstName: 'Maria',
      initials: 'MK',
      secondary: 'maria@example.com',
      avatarUrl: 'https://api.example.com/assets/avatar',
    });
  });

  it('does not expose generic admin labels as learner identity', () => {
    const identity = userIdentity({ email: 'atefalvi@example.com', firstName: 'Admin' });
    expect(identity.displayName).toBe('atefalvi');
    expect(identity.firstName).toBeUndefined();
    expect(identity.initials).toBe('A');
  });

  it('provides a neutral fallback when profile fields are unavailable', () => {
    expect(userIdentity({ email: '' })).toMatchObject({
      displayName: 'DataDreamer member',
      initials: 'DD',
      secondary: 'Signed in securely',
    });
  });
});
