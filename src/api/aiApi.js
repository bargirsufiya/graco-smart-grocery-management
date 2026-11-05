// Module 5 AI assistant API (/api/ai)

import { apiRequest } from "./apiClient";

export const AI_FEATURES = [
  "recommendations",
  "quantities",
  "recipes",
  "generate-list",
  "waste-tips",
];

// prompt: the user's own request in plain language (optional)
export const runAIFeature = (feature, { inventory, householdSize, prompt, listId }) =>
  apiRequest(`/ai/${feature}`, {
    method: "POST",
    body: { inventory, householdSize, prompt, listId },
  });
