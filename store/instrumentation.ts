export async function register() {
  // Validate required env vars at startup
  const { validateEnvOrThrow } = await import("./lib/env");
  validateEnvOrThrow();

  // Initialise Sentry for the correct runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
