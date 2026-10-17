import "server-only";
import { config } from "@/lib/config";
import { demoProvider } from "./demo-provider";
import type { AIProvider } from "./types";

// Provider registry. Selected by AI_PROVIDER; falls back to the deterministic demo layer when
// no key is configured or a provider call fails, so the MVP is never unusable.

const providers: Record<string, () => AIProvider> = {
  demo: () => demoProvider,
  // anthropic: () => createAnthropicProvider(config.aiApiKey),  // TODO: LLM classification (structured output)
};

export function getAIProvider(): AIProvider {
  if (config.aiProvider === "demo" || !config.aiApiKey) return demoProvider;
  const factory = providers[config.aiProvider];
  if (!factory) {
    console.warn(`[ai] Unknown AI_PROVIDER "${config.aiProvider}", using demo AI`);
    return demoProvider;
  }
  return factory();
}
