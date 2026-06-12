import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('tooling baseline', () => {
  it('runs Vitest against TypeScript modules', () => {
    const schema = z.object({
      status: z.literal('ready'),
    });

    expect(schema.parse({ status: 'ready' })).toEqual({ status: 'ready' });
  });
});
