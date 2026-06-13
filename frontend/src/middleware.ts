import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  if (process.env.DEPLOY_ENV === 'staging' || import.meta.env.DEPLOY_ENV === 'staging') {
    response.headers.set('X-Robots-Tag', 'noindex');
  }

  return response;
});
