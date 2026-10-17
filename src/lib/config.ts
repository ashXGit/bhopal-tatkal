// Server-side configuration. Never import this from client components.

export const config = {
  aiProvider: (process.env.AI_PROVIDER ?? "demo").toLowerCase(),
  aiApiKey: process.env.AI_API_KEY ?? "",
  authSecret: process.env.AUTH_SECRET ?? "",
  demoMode: (process.env.DEMO_MODE ?? "true") === "true",
};

export function assertServerConfig() {
  if (process.env.NODE_ENV === "production" && config.authSecret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters in production.");
  }
}
