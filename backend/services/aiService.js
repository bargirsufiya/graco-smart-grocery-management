// Module 5: AI grocery assistant.
// Uses Google Gemini when GEMINI_API_KEY is set. If the key is missing, or the
// Gemini call fails (quota, invalid key, network), it falls back to the
// rule-based engine in aiRules.js and says so in the response.

const { GoogleGenAI } = require("@google/genai");
const rules = require("./aiRules");

const { sameItem, daysUntil, pendingNames } = rules.helpers;

// Flash-Lite is free and answers in a few seconds; set GEMINI_MODEL to try others
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
// Flash-Lite supports "minimal" thinking (fastest); larger Flash models need "low" or higher
const THINKING = process.env.GEMINI_THINKING || (MODEL.includes("lite") ? "minimal" : "low");
const TIMEOUT_MS = 45 * 1000;
const CATEGORIES = ["Fruits", "Vegetables", "Dairy", "Bakery", "Meat", "Pantry", "Other"];
const UNITS = ["pcs", "kg", "g", "liter", "ml", "pack", "dozen"];
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["expired", "urgent", "use-soon"];

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

// ---------- JSON schemas Gemini must follow ----------

// Allowed values are described in text, not enums: Gemini rejects schemas that are
// too complex for long lists. validate() below fixes any value outside the list.
const ITEM_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string", description: `One of: ${CATEGORIES.join(", ")}` },
    quantity: { type: "number" },
    unit: { type: "string", description: `One of: ${UNITS.join(", ")}` },
    priority: { type: "string", description: `One of: ${PRIORITIES.join(", ")}` },
    reason: { type: "string" },
  },
  required: ["name", "category", "quantity", "unit", "priority", "reason"],
};

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    time: { type: "string" },
    servings: { type: "integer" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "string" },
          available: { type: "boolean" },
        },
        required: ["name", "quantity", "available"],
      },
    },
    steps: { type: "array", items: { type: "string" } },
    reason: { type: "string" },
  },
  required: ["title", "time", "servings", "ingredients", "steps", "reason"],
};

const TIP_SCHEMA = {
  type: "object",
  properties: {
    item: { type: "string" },
    category: { type: "string" },
    daysLeft: { type: "integer" },
    status: { type: "string", enum: STATUSES },
    tip: { type: "string" },
  },
  required: ["item", "category", "daysLeft", "status", "tip"],
};

const itemsSchema = (maxItems) => ({
  type: "object",
  properties: {
    summary: { type: "string" },
    listName: { type: "string" },
    items: { type: "array", items: ITEM_SCHEMA, maxItems },
  },
  required: ["summary", "listName", "items"],
});

const SCHEMAS = {
  recommendations: itemsSchema(15),
  quantities: itemsSchema(25),
  "generate-list": itemsSchema(25),
  recipes: {
    type: "object",
    properties: {
      summary: { type: "string" },
      recipes: { type: "array", items: RECIPE_SCHEMA, maxItems: 6 },
    },
    required: ["summary", "recipes"],
  },
  "waste-tips": {
    type: "object",
    properties: {
      summary: { type: "string" },
      tips: { type: "array", items: TIP_SCHEMA, maxItems: 20 },
      recipes: { type: "array", items: RECIPE_SCHEMA, maxItems: 3 },
    },
    required: ["summary", "tips", "recipes"],
  },
};

// ---------- What each feature asks Gemini to do ----------

const TASKS = {
  recommendations:
    "Recommend grocery items the user is likely to need soon. Consider low inventory stock, items bought repeatedly in past lists, items that pair with the pending list, missing staples, and the user's request if given. Do not suggest items already pending on a list or well stocked. Give a short reason for each.",
  quantities:
    "Suggest a sensible purchase quantity for each pending (not completed) list item for the household size (only the given list if listId is set). Keep each item name exactly as it appears in the list. Follow the user's request if it changes the period or situation (e.g. 'for a month', 'for guests'). Explain each quantity in the reason.",
  recipes:
    "Create new, practical recipes that answer the user's request. If there is no request, suggest recipes that use the inventory and pending list items, preferring items that expire soon. Create the recipes yourself; do not limit yourself to any fixed list. For each recipe give ingredient quantities for the servings, mark available=true only for ingredients present in the inventory or pending lists, give clear numbered-style steps (as separate strings) and a total time like '25 min'.",
  "generate-list":
    "Generate a complete grocery shopping list for the user's request (e.g. party, trip, monthly shopping, diet). Understand the number of people and the duration from the request; otherwise use the household size and one week. Give realistic quantities and units, and make the list complete (usually 12-25 items covering all the meals and needs of the request). Skip items that are already well stocked in the inventory. Give the list a short listName (max 40 characters).",
  "waste-tips":
    "Find inventory items that are expired or expire within 7 days (use the daysLeft values given). For each give daysLeft, status (expired if daysLeft < 0, urgent for 0-2, use-soon for 3-7) and one practical tip to avoid wasting it. Also create up to 3 recipes that use those items. Follow the user's request if given.",
};

const SYSTEM_INSTRUCTION =
  "You are the smart grocery assistant inside Graco, a grocery management app used by families. " +
  "You receive the user's request (may be empty), their grocery lists, kitchen inventory and household size as JSON. " +
  "Only answer food, cooking and grocery requests; if the request is unrelated, answer with an empty array and say so in the summary. " +
  "Use common Indian and international household groceries, keep reasons under 15 words, and reply only with JSON matching the schema.";

// Only send what the model needs, without database ids or user details
const buildContext = ({ lists, inventory, householdSize, prompt, listId }) => ({
  today: new Date().toISOString().slice(0, 10),
  userRequest: prompt || "",
  householdSize,
  listId: listId || "",
  lists: lists.map((list) => ({
    id: String(list._id),
    name: list.name,
    items: (list.items || []).map((i) => ({
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      completed: Boolean(i.completed),
    })),
  })),
  inventory: inventory.map((i) => ({
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    expiryDate: i.expiryDate || null,
    daysLeft: i.expiryDate ? daysUntil(i.expiryDate) : null,
    lowStockThreshold: i.lowStockThreshold ?? null,
  })),
});

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("Gemini timed out"), { code: "TIMEOUT" })), ms)),
  ]);

async function askGemini(feature, input) {
  const ai = getClient();
  if (!ai) return null;

  const interaction = await withTimeout(
    ai.interactions.create({
      model: MODEL,
      store: false,
      system_instruction: SYSTEM_INSTRUCTION,
      input: `Task: ${TASKS[feature]}\n\nData:\n${JSON.stringify(buildContext(input))}`,
      response_format: { type: "text", mime_type: "application/json", schema: SCHEMAS[feature] },
      generation_config: { thinking_level: THINKING, max_output_tokens: 8192 },
    }),
    TIMEOUT_MS
  );

  const text = interaction.output_text;
  if (!text) throw new Error("Gemini returned no text");
  return JSON.parse(text);
}

// ---------- Validate Gemini's JSON before it reaches the screen ----------

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

const cleanItem = (raw) => {
  const name = str(raw?.name, 60);
  const quantity = Number(raw?.quantity);
  if (!name) return null;
  return {
    name,
    category: pick(raw.category, CATEGORIES, "Other"),
    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity * 100) / 100 : 1,
    unit: pick(raw.unit, UNITS, "pcs"),
    priority: pick(raw.priority, PRIORITIES, "Medium"),
    reason: str(raw.reason, 160),
  };
};

const cleanRecipe = (raw, haveNames, householdSize) => {
  const title = str(raw?.title, 80);
  const steps = list(raw?.steps, 12).map((s) => str(s, 300)).filter(Boolean);
  if (!title || steps.length === 0) return null;
  const ingredients = list(raw.ingredients, 25)
    .map((ing) => {
      const name = str(ing?.name, 60);
      if (!name) return null;
      // Trust the model, but also mark items we can see in the inventory or lists
      const available = Boolean(ing.available) || haveNames.some((n) => sameItem(n, name));
      return { name, quantity: str(ing.quantity, 40), available };
    })
    .filter(Boolean);
  const servings = Number.parseInt(raw.servings, 10);
  return {
    title,
    time: str(raw.time, 30) || "-",
    servings: servings > 0 && servings <= 50 ? servings : householdSize,
    ingredients,
    uses: ingredients.filter((i) => i.available).map((i) => i.name),
    missing: ingredients.filter((i) => !i.available).map((i) => i.name),
    steps,
    reason: str(raw.reason, 160),
  };
};

const cleanTip = (raw) => {
  const item = str(raw?.item, 60);
  const daysLeft = Number.parseInt(raw?.daysLeft, 10);
  if (!item || !Number.isFinite(daysLeft)) return null;
  return {
    item,
    category: str(raw.category, 30) || "Other",
    daysLeft,
    status: pick(raw.status, STATUSES, daysLeft < 0 ? "expired" : daysLeft <= 2 ? "urgent" : "use-soon"),
    tip: str(raw.tip, 240),
  };
};

function validate(feature, raw, input) {
  if (!raw || typeof raw !== "object") throw new Error("Gemini returned an invalid response");
  const haveNames = input.inventory
    .filter((i) => Number(i.quantity) > 0)
    .map((i) => i.name)
    .concat(pendingNames(input.lists));
  const result = { summary: str(raw.summary, 400) };

  if (SCHEMAS[feature].properties.items) {
    result.items = list(raw.items, 40).map(cleanItem).filter(Boolean);
    if (feature === "generate-list") result.listName = str(raw.listName, 40) || "AI Shopping List";
  }
  if (SCHEMAS[feature].properties.recipes) {
    result.recipes = list(raw.recipes, 6).map((r) => cleanRecipe(r, haveNames, input.householdSize)).filter(Boolean);
  }
  if (SCHEMAS[feature].properties.tips) {
    result.tips = list(raw.tips, 20).map(cleanTip).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }
  return result;
}

// ---------- Explain failures in plain words ----------

function fallbackReason(err) {
  const status = err?.status;
  if (status === 429) return "Gemini's free-tier limit was reached, so smart-rules results are shown. Please try again in a minute.";
  if (status === 503 || status === 500) return "Gemini is busy right now (high demand), so smart-rules results are shown. Please try again shortly.";
  if (status === 401 || status === 403 || (status === 400 && /api.?key/i.test(err.message)))
    return "Gemini rejected the API key (check GEMINI_API_KEY), so smart-rules results are shown.";
  if (status === 400) return "Gemini could not handle this request (check GEMINI_MODEL), so smart-rules results are shown.";
  if (err?.code === "TIMEOUT") return "Gemini took too long to answer, so smart-rules results are shown.";
  if (err instanceof SyntaxError) return "Gemini sent an answer that could not be read, so smart-rules results are shown.";
  return "Gemini could not be reached, so smart-rules results are shown.";
}

const FEATURES = Object.keys(TASKS);

async function runFeature(feature, input) {
  const fallback = () => rules[feature](input);

  if (!getClient()) {
    return {
      ...fallback(),
      source: "rules",
      fallback: true,
      note: "Gemini AI is not configured (no GEMINI_API_KEY), so smart-rules results are shown.",
    };
  }

  try {
    const result = validate(feature, await askGemini(feature, input), input);
    return { ...result, source: "gemini", model: MODEL };
  } catch (err) {
    console.error(`AI (${feature}) fell back to rules:`, err.status || "", err.message);
    return { ...fallback(), source: "rules", fallback: true, note: fallbackReason(err) };
  }
}

module.exports = { runFeature, FEATURES, validate, MODEL };
