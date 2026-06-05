import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  beforeSend(event) {
    // Scrub DB connection strings from stack traces
    if (event.extra?.["DATABASE_URL"]) {
      event.extra["DATABASE_URL"] = "[REDACTED]";
    }
    return event;
  },
});
