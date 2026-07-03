import { describe, expect, it } from 'vitest';
import { userIdentity } from '../identity';

describe('userIdentity', () => {
  it('uses a real profile name and avatar', () => {
    expect(userIdentity({
      email: 'maria@example.com',
      firstName: 'Maria',
      lastName: 'Khan',
      provider: 'google',
      avatarUrl: 'https://api.example.com/assets/avatar',
      googlePictureUrl: 'https://lh3.googleusercontent.com/a/photo',
    })).toEqual({
      displayName: 'Maria Khan',
      firstName: 'Maria',
      initials: 'MK',
      secondary: 'maria@example.com',
      providerLabel: 'Google connected',
      avatarUrl: 'https://api.example.com/assets/avatar',
    });
  });

  it('uses a Google picture URL when no Directus avatar URL exists', () => {
    expect(userIdentity({
      email: 'maria@example.com',
      firstName: 'Maria',
      provider: 'google',
      googlePictureUrl: 'https://lh3.googleusercontent.com/a/photo',
    })).toMatchObject({
      initials: 'M',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
    });
  });

  it('falls back to initials when neither avatar source exists', () => {
    expect(userIdentity({
      email: 'maria@example.com',
      firstName: 'Maria',
      provider: 'google',
    })).toMatchObject({
      initials: 'M',
      avatarUrl: undefined,
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
      providerLabel: 'Email account',
    });
  });
});
