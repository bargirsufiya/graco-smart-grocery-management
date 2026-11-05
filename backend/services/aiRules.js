// Module 5: rule-based grocery assistant.
// Used when no Gemini API key is configured, or when the Gemini call fails,
// so every AI feature still returns useful results.

const DAY = 24 * 60 * 60 * 1000;

// Category, default unit and weekly amount per person for common items
const CATALOG = {
  milk: { category: "Dairy", unit: "liter", perPerson: 1.5 },
  eggs: { category: "Dairy", unit: "pcs", perPerson: 4 },
  butter: { category: "Dairy", unit: "g", perPerson: 50 },
  cheese: { category: "Dairy", unit: "g", perPerson: 100 },
  yogurt: { category: "Dairy", unit: "g", perPerson: 250 },
  paneer: { category: "Dairy", unit: "g", perPerson: 100 },
  curd: { category: "Dairy", unit: "g", perPerson: 250 },
  bread: { category: "Bakery", unit: "pack", perPerson: 0.5 },
  rice: { category: "Other", unit: "kg", perPerson: 1 },
  pasta: { category: "Other", unit: "g", perPerson: 250 },
  "pasta sauce": { category: "Other", unit: "pack", perPerson: 0.25 },
  flour: { category: "Other", unit: "kg", perPerson: 0.75 },
  lentils: { category: "Other", unit: "kg", perPerson: 0.4 },
  oats: { category: "Other", unit: "g", perPerson: 200 },
  sugar: { category: "Other", unit: "kg", perPerson: 0.2 },
  "cooking oil": { category: "Other", unit: "liter", perPerson: 0.2 },
  salt: { category: "Other", unit: "pack", perPerson: 0.1 },
  tea: { category: "Other", unit: "pack", perPerson: 0.1 },
  coffee: { category: "Other", unit: "pack", perPerson: 0.1 },
  tomatoes: { category: "Vegetables", unit: "kg", perPerson: 0.5 },
  onions: { category: "Vegetables", unit: "kg", perPerson: 0.5 },
  potatoes: { category: "Vegetables", unit: "kg", perPerson: 0.75 },
  spinach: { category: "Vegetables", unit: "g", perPerson: 200 },
  carrots: { category: "Vegetables", unit: "kg", perPerson: 0.25 },
  garlic: { category: "Vegetables", unit: "g", perPerson: 50 },
  ginger: { category: "Vegetables", unit: "g", perPerson: 50 },
  "bell peppers": { category: "Vegetables", unit: "pcs", perPerson: 1 },
  cucumber: { category: "Vegetables", unit: "pcs", perPerson: 1 },
  lettuce: { category: "Vegetables", unit: "pcs", perPerson: 0.5 },
  bananas: { category: "Fruits", unit: "dozen", perPerson: 0.5 },
  apples: { category: "Fruits", unit: "kg", perPerson: 0.5 },
  lemons: { category: "Fruits", unit: "pcs", perPerson: 2 },
  oranges: { category: "Fruits", unit: "kg", perPerson: 0.5 },
  chicken: { category: "Meat", unit: "kg", perPerson: 0.5 },
  fish: { category: "Meat", unit: "kg", perPerson: 0.3 },
};

// Items that are usually bought together
const PAIRS = {
  bread: ["butter", "eggs"],
  pasta: ["pasta sauce", "cheese"],
  rice: ["lentils", "onions"],
  tea: ["milk", "sugar"],
  coffee: ["milk", "sugar"],
  chicken: ["onions", "garlic", "ginger"],
  tomatoes: ["onions", "garlic"],
  lettuce: ["cucumber", "tomatoes"],
  oats: ["milk", "bananas"],
};

const STAPLES = ["milk", "eggs", "bread", "rice", "onions", "tomatoes", "potatoes", "bananas"];

const RECIPES = [
  { title: "Vegetable Fried Rice", time: "25 min", ingredients: ["rice", "carrots", "bell peppers", "onions", "eggs", "garlic"], steps: ["Cook and cool the rice.", "Stir-fry chopped vegetables with garlic.", "Add scrambled eggs and rice, season and toss."] },
  { title: "Tomato Pasta", time: "20 min", ingredients: ["pasta", "tomatoes", "garlic", "onions", "cheese"], steps: ["Boil the pasta.", "Cook onions, garlic and chopped tomatoes into a sauce.", "Mix with pasta and top with cheese."] },
  { title: "Spinach Omelette", time: "10 min", ingredients: ["eggs", "spinach", "onions", "cheese"], steps: ["Whisk the eggs with salt.", "Saute onions and spinach.", "Pour in eggs, add cheese and fold."] },
  { title: "Dal Tadka with Rice", time: "35 min", ingredients: ["lentils", "rice", "onions", "tomatoes", "garlic", "ginger"], steps: ["Pressure-cook the lentils.", "Fry onions, garlic, ginger and tomatoes.", "Mix into the dal and serve with rice."] },
  { title: "Paneer Bhurji", time: "15 min", ingredients: ["paneer", "onions", "tomatoes", "bell peppers"], steps: ["Saute onions, tomatoes and peppers.", "Crumble in the paneer and spices.", "Cook for 3 minutes and serve."] },
  { title: "Chicken Curry", time: "45 min", ingredients: ["chicken", "onions", "tomatoes", "garlic", "ginger", "yogurt"], steps: ["Marinate chicken in yogurt.", "Cook onions, garlic, ginger and tomatoes into a masala.", "Add chicken and simmer until cooked."] },
  { title: "Banana Oat Smoothie", time: "5 min", ingredients: ["bananas", "oats", "milk", "yogurt"], steps: ["Add everything to a blender.", "Blend until smooth."] },
  { title: "Garden Salad", time: "10 min", ingredients: ["lettuce", "cucumber", "tomatoes", "carrots", "lemons"], steps: ["Chop the vegetables.", "Dress with lemon juice, salt and pepper."] },
  { title: "Aloo Paratha", time: "40 min", ingredients: ["flour", "potatoes", "onions", "butter"], steps: ["Boil and mash the potatoes with spices.", "Stuff into dough and roll out.", "Cook on a pan with butter."] },
  { title: "French Toast", time: "15 min", ingredients: ["bread", "eggs", "milk", "butter", "sugar"], steps: ["Whisk eggs, milk and sugar.", "Dip bread slices.", "Fry in butter until golden."] },
  { title: "Fruit Bowl with Yogurt", time: "5 min", ingredients: ["apples", "bananas", "oranges", "yogurt"], steps: ["Chop the fruit.", "Top with yogurt."] },
  { title: "Lemon Garlic Fish", time: "25 min", ingredients: ["fish", "lemons", "garlic", "butter"], steps: ["Season fish with salt and lemon.", "Pan-fry in butter and garlic until flaky."] },
];

// Starter lists for "generate a list" goals
const TEMPLATES = [
  { keywords: ["breakfast", "morning"], items: ["eggs", "bread", "milk", "butter", "oats", "bananas", "tea"] },
  { keywords: ["vegetarian", "veg", "veggie"], items: ["paneer", "lentils", "spinach", "tomatoes", "onions", "potatoes", "rice", "curd"] },
  { keywords: ["party", "guests", "celebration"], items: ["cheese", "bread", "cucumber", "tomatoes", "lemons", "apples", "oranges", "chicken"] },
  { keywords: ["healthy", "diet", "fitness", "protein"], items: ["oats", "eggs", "yogurt", "spinach", "chicken", "apples", "carrots", "lentils"] },
  { keywords: ["budget", "cheap", "save"], items: ["rice", "lentils", "potatoes", "onions", "flour", "eggs", "bananas"] },
  { keywords: ["pasta", "italian"], items: ["pasta", "pasta sauce", "tomatoes", "garlic", "cheese", "bell peppers"] },
  { keywords: ["salad"], items: ["lettuce", "cucumber", "tomatoes", "carrots", "lemons"] },
  { keywords: ["week", "weekly", "monthly", "month"], items: STAPLES.concat(["lentils", "flour", "cooking oil", "apples", "spinach"]) },
];

const normalize = (name) => String(name || "").trim().toLowerCase();

// "Tomato" and "tomatoes" should count as the same item
const singular = (name) => normalize(name).replace(/(es|s)$/, "");
const sameItem = (a, b) => singular(a) === singular(b);

const titleCase = (name) => name.replace(/\b\w/g, (c) => c.toUpperCase());

const catalogEntry = (name) => {
  const key = Object.keys(CATALOG).find((k) => sameItem(k, name));
  return key ? { key, ...CATALOG[key] } : null;
};

const roundQuantity = (value, unit) => {
  if (unit === "g" || unit === "ml") return Math.max(50, Math.round(value / 50) * 50);
  if (unit === "kg" || unit === "liter") return Math.max(0.5, Math.round(value * 2) / 2);
  return Math.max(1, Math.round(value));
};

const suggestQuantity = (name, householdSize = 2) => {
  const entry = catalogEntry(name);
  if (!entry) return { quantity: 1, unit: "pcs" };
  return { quantity: roundQuantity(entry.perPerson * householdSize, entry.unit), unit: entry.unit };
};

const makeItem = (name, reason, priority = "Medium", householdSize = 2) => {
  const entry = catalogEntry(name);
  const { quantity, unit } = suggestQuantity(name, householdSize);
  return {
    name: titleCase(entry ? entry.key : normalize(name)),
    category: entry ? entry.category : "Other",
    quantity,
    unit,
    priority,
    reason,
  };
};

const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / DAY);

const allItemNames = (lists) => lists.flatMap((list) => (list.items || []).map((i) => i.name));

const pendingNames = (lists) =>
  lists.flatMap((list) => (list.items || []).filter((i) => !i.completed).map((i) => i.name));

const has = (names, name) => names.some((n) => sameItem(n, name));

const addUnique = (results, item) => {
  if (!results.some((r) => sameItem(r.name, item.name))) results.push(item);
};

function recommendations({ lists, inventory, householdSize }) {
  const results = [];
  const pending = pendingNames(lists);
  const stock = inventory.map((i) => i.name);

  // 1. Low or empty stock in the inventory
  for (const item of inventory) {
    const threshold = Number(item.lowStockThreshold ?? 1);
    if (Number(item.quantity) <= threshold && !has(pending, item.name)) {
      addUnique(results, {
        ...makeItem(item.name, `Only ${item.quantity} ${item.unit || ""} left in your inventory`.trim(), "High", householdSize),
        category: item.category || catalogEntry(item.name)?.category || "Other",
      });
    }
  }

  // 2. Items the user buys often (bought in 2+ lists) but has not added this time
  const counts = {};
  for (const name of allItemNames(lists)) counts[singular(name)] = (counts[singular(name)] || 0) + 1;
  for (const [key, count] of Object.entries(counts)) {
    if (count >= 2 && !has(pending, key) && !has(stock, key)) {
      addUnique(results, makeItem(key, `You have bought this ${count} times before`, "Medium", householdSize));
    }
  }

  // 3. Items that go well with what is already on the list
  for (const name of pending) {
    const partners = PAIRS[catalogEntry(name)?.key] || [];
    for (const partner of partners) {
      if (!has(pending, partner) && !has(stock, partner)) {
        addUnique(results, makeItem(partner, `Goes well with ${titleCase(normalize(name))}`, "Low", householdSize));
      }
    }
  }

  // 4. Basic staples that are missing everywhere
  for (const staple of STAPLES) {
    if (!has(pending, staple) && !has(stock, staple)) {
      addUnique(results, makeItem(staple, "Household staple missing from your lists and inventory", "Low", householdSize));
    }
  }

  return {
    summary: results.length
      ? `Found ${results.length} items you may need based on your stock, buying history and current lists.`
      : "Your lists and inventory already cover the essentials.",
    items: results.slice(0, 12),
  };
}

function quantities({ lists, householdSize, listId }) {
  const target = listId ? lists.filter((l) => String(l._id) === String(listId)) : lists;
  const items = [];
  for (const list of target) {
    for (const item of list.items || []) {
      if (item.completed) continue;
      const suggestion = suggestQuantity(item.name, householdSize);
      const known = Boolean(catalogEntry(item.name));
      const current = `${item.quantity} ${item.unit}`;
      addUnique(items, {
        name: item.name,
        category: item.category || "Other",
        quantity: suggestion.quantity,
        unit: known ? suggestion.unit : item.unit || "pcs",
        priority: item.priority || "Medium",
        reason: known
          ? `About one week's use for ${householdSize} ${householdSize === 1 ? "person" : "people"} (you have ${current})`
          : `No usage data for this item, keep ${current}`,
      });
    }
  }
  return {
    summary: items.length
      ? `Suggested weekly quantities for ${householdSize} ${householdSize === 1 ? "person" : "people"}.`
      : "Add some pending items to a list to get quantity suggestions.",
    items,
  };
}

// Known items the user typed in their request ("recipe with potatoes and onions")
const mentionedItems = (text) =>
  Object.keys(CATALOG).filter((k) => normalize(text).includes(singular(k)));

function recipes({ lists, inventory, householdSize = 2, prompt = "" }) {
  const mentioned = mentionedItems(prompt);
  const available = inventory
    .filter((i) => Number(i.quantity) > 0 && !(i.expiryDate && daysUntil(i.expiryDate) < 0))
    .map((i) => i.name)
    .concat(pendingNames(lists), mentioned);
  const expiring = inventory
    .filter((i) => i.expiryDate && daysUntil(i.expiryDate) >= 0 && daysUntil(i.expiryDate) <= 3)
    .map((i) => i.name);

  const ranked = RECIPES.map((recipe) => {
    const uses = recipe.ingredients.filter((ing) => has(available, ing));
    const missing = recipe.ingredients.filter((ing) => !has(available, ing));
    const usesExpiring = recipe.ingredients.filter((ing) => has(expiring, ing));
    const usesMentioned = recipe.ingredients.filter((ing) => has(mentioned, ing));
    return {
      title: recipe.title,
      time: recipe.time,
      servings: householdSize,
      ingredients: recipe.ingredients.map((ing) => ({
        name: titleCase(ing),
        quantity: "as needed",
        available: has(available, ing),
      })),
      uses: uses.map(titleCase),
      missing: missing.map(titleCase),
      steps: recipe.steps,
      reason: usesExpiring.length
        ? `Uses ${usesExpiring.map(titleCase).join(", ")} before it expires`
        : `You already have ${uses.length} of ${recipe.ingredients.length} ingredients`,
      // Recipes that use what the user asked for come first
      score: uses.length / recipe.ingredients.length + usesExpiring.length + 2 * usesMentioned.length,
      matchesRequest: mentioned.length === 0 || usesMentioned.length > 0,
    };
  })
    .filter((r) => r.uses.length > 0 && r.matchesRequest)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, matchesRequest, ...rest }) => rest);

  return {
    summary: ranked.length
      ? "Recipes ranked by how many ingredients you already have, with expiring items first."
      : "Add items to your inventory or lists to get recipe ideas.",
    recipes: ranked,
  };
}

function generateList({ lists, inventory, householdSize: size, goal }) {
  const text = normalize(goal);
  // "party for 10 people" overrides the household size box
  const peopleInText =
    text.match(/(\d+)\s*(people|persons|guests|members|adults)/) || text.match(/(?:family|group|team) of (\d+)/);
  const householdSize = peopleInText ? Math.min(50, Number(peopleInText[1])) : size;
  const stock = inventory.filter((i) => Number(i.quantity) > Number(i.lowStockThreshold ?? 0)).map((i) => i.name);
  const matched = TEMPLATES.filter((t) => t.keywords.some((k) => text.includes(k)));
  const names = matched.length ? matched.flatMap((t) => t.items) : STAPLES;

  // Also pick up any known items the user typed directly ("milk and apples")
  const typed = Object.keys(CATALOG).filter((k) => text.includes(k) || text.includes(singular(k)));

  const items = [];
  for (const name of typed.concat(names)) {
    if (has(stock, name)) continue;
    addUnique(items, makeItem(name, typed.includes(name) ? "You asked for this" : `Fits "${goal || "a general shop"}"`, "Medium", householdSize));
  }
  for (const item of recommendations({ lists, inventory, householdSize }).items) {
    if (item.priority === "High") addUnique(items, item);
  }

  items.splice(15);

  return {
    summary: `Generated a ${items.length}-item list for ${householdSize} ${householdSize === 1 ? "person" : "people"}${goal && goal.length <= 40 ? ` (${goal})` : ""}, skipping what is already in stock.`,
    listName: goal ? titleCase(goal).slice(0, 40).trim() : "AI Shopping List",
    items,
  };
}

const STORAGE_TIPS = {
  Fruits: "Keep in the fridge crisper drawer, or blend into smoothies before it goes soft.",
  Vegetables: "Blanch and freeze, or use in a soup, stir-fry or curry today.",
  Dairy: "Use in baking or smoothies, or freeze cheese and butter in portions.",
  Bakery: "Toast it, turn it into breadcrumbs or French toast, or freeze slices.",
  Meat: "Cook today or move to the freezer immediately.",
  Pantry: "Move it to the front of the shelf and plan a meal around it this week.",
  Other: "Move it to the front of the fridge or shelf and plan to use it this week.",
};

function wasteTips({ inventory }) {
  const tips = [];
  for (const item of inventory) {
    if (!item.expiryDate) continue;
    const days = daysUntil(item.expiryDate);
    if (days > 7) continue;
    const category = item.category || catalogEntry(item.name)?.category || "Other";
    let status = "use-soon";
    let tip = STORAGE_TIPS[category] || STORAGE_TIPS.Other;
    if (days < 0) {
      status = "expired";
      tip = "Expired - check it before use. Compost it if spoiled and buy less next time.";
    } else if (days <= 2) {
      status = "urgent";
    }
    tips.push({ item: item.name, category, daysLeft: days, status, tip });
  }
  tips.sort((a, b) => a.daysLeft - b.daysLeft);

  const expiredCount = tips.filter((t) => t.status === "expired").length;
  const summary = tips.length
    ? `${tips.length} item(s) need attention${expiredCount ? `, ${expiredCount} already expired` : ""}. Use the urgent ones first.`
    : "Nothing in your inventory expires in the next 7 days.";

  return { summary, tips, recipes: recipes({ lists: [], inventory }).recipes.slice(0, 3) };
}

// Shared helpers, also used to check Gemini answers in aiService.js
module.exports.helpers = { sameItem, daysUntil, pendingNames };

Object.assign(module.exports, {
  recommendations,
  quantities,
  recipes,
  "generate-list": generateList,
  "waste-tips": wasteTips,
});
