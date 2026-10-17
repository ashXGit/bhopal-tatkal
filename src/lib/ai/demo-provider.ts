import { classifyDemo } from "./demo-classifier";
import { demoEmbedding } from "./embedding";
import type { AIProvider } from "./types";

// Deterministic, offline AI layer. Always available; results are labelled "Demo AI Processing".
export const demoProvider: AIProvider = {
  name: "demo",
  isDemo: true,
  classify: async (input) => classifyDemo(input),
  embed: async (text) => demoEmbedding(text),
};
