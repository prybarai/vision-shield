import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'dummy', {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 0,
});

export default client;
