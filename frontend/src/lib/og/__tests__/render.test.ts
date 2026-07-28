import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { renderOgCard } from '../render';

describe('renderOgCard', () => {
  it('renders a social-card-safe PNG for a long editorial title', async () => {
    const png = await renderOgCard({
      kicker: 'Project · 2026',
      title: 'Building a reliable Tableau waterfall chart with Gantt bars',
      authorName: 'Syed Atef Alvi',
      tag: 'Data visualization',
      seed: 'tableau-waterfall-chart-gantt-method',
    });
    const metadata = await sharp(png).metadata();

    if (process.env.OG_PREVIEW_PATH) {
      await writeFile(process.env.OG_PREVIEW_PATH, png);
    }

    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
    expect(png.byteLength).toBeLessThan(500_000);
  });

  it('uses a supplied cover image while preserving the OG card dimensions', async () => {
    const cover = await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 3,
        background: '#42d392',
      },
    }).jpeg().toBuffer();
    const input = {
      kicker: 'Post',
      title: 'Cover-aware social card',
      authorName: 'Data Dreamer',
      seed: 'cover-aware-social-card',
    };

    const [fallback, withCover] = await Promise.all([
      renderOgCard(input),
      renderOgCard({
        ...input,
        coverDataUri: `data:image/jpeg;base64,${cover.toString('base64')}`,
      }),
    ]);
    const metadata = await sharp(withCover).metadata();

    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
    expect(withCover.equals(fallback)).toBe(false);
  });
});
