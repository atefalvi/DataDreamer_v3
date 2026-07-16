import { describe, expect, it } from 'vitest';
import { publicAuthorProfilePath, writingAuthorPath } from '../publicProfile';

describe('public author links', () => {
  const approved = { slug: 'syed-atef-alvi', name: 'Syed Atef Alvi', dreamTeam: true };

  it('links approved authors to their public Dream Team profile', () => {
    expect(publicAuthorProfilePath(approved)).toBe('/dream-team/syed-atef-alvi');
  });

  it('never links a non-team byline to a nonexistent Dream Team page', () => {
    const contributor = { ...approved, dreamTeam: false };
    expect(publicAuthorProfilePath(contributor)).toBeUndefined();
    expect(writingAuthorPath(contributor)).toBe('/blog?author=syed-atef-alvi');
  });

  it.each(['', 'unknown', 'Bad Slug', '../admin'])('rejects invalid author slug %s', (slug) => {
    const author = { slug, name: 'Unknown', dreamTeam: true };
    expect(publicAuthorProfilePath(author)).toBeUndefined();
    expect(writingAuthorPath(author)).toBeUndefined();
  });
});
