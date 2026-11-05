// Module 5: AI Grocery Assistant & Smart Recommendations.
// Reads grocery lists (Module 2/4, from props) and inventory (Module 3),
// asks the backend /api/ai for suggestions, and adds chosen items to a list.

import { useEffect, useState } from "react";
import ModuleShell from "./ModuleShell";
import { runAIFeature } from "../api/aiApi";
import { listRecords } from "../utils/module3Api";

// Each tab has its own free-text request box with a few example requests
const TABS = [
  {
    id: "recommendations", label: "Recommendations", icon: "fa-lightbulb",
    hint: "Items you are likely to need, based on your stock, buying history and current lists.",
    ask: "Anything specific? (optional)",
    examples: ["What am I running low on?", "Suggest healthy snacks for kids", "What do I need for this week's breakfasts?"],
  },
  {
    id: "quantities", label: "Smart Quantities", icon: "fa-scale-balanced",
    hint: "How much of each pending list item to buy for your household.",
    ask: "Any special situation? (optional)",
    examples: ["Quantities for one month", "We have 3 guests this weekend", "Buy for 2 weeks"],
  },
  {
    id: "recipes", label: "Recipes", icon: "fa-utensils",
    hint: "Ask for any recipe, or leave it empty to cook with what you already have.",
    ask: "What would you like to cook?",
    examples: [
      "Suggest a healthy breakfast",
      "Give me a recipe using potatoes, onions and tomatoes",
      "Suggest 5 dinner recipes for 4 people",
      "What can I cook with my available inventory?",
      "Suggest a vegetarian high-protein meal",
    ],
  },
  {
    id: "generate-list", label: "Generate List", icon: "fa-wand-magic-sparkles",
    hint: "Describe what you are shopping for and get a complete list with quantities.",
    ask: "What are you shopping for?",
    examples: [
      "Grocery list for a birthday party of 10 people",
      "Monthly grocery list for a family of 5",
      "Healthy weekly shopping list",
      "Budget-friendly vegetarian grocery list",
      "Grocery list for a 7-day trip",
    ],
  },
  {
    id: "waste-tips", label: "Expiry & Waste", icon: "fa-leaf",
    hint: "Items expiring soon in your inventory, with tips to avoid waste.",
    ask: "Any question about leftovers or storage? (optional)",
    examples: ["How do I store my vegetables longer?", "Quick meals with my expiring items"],
  },
];

const PRIORITY_BADGE = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-emerald-100 text-emerald-800",
};

const STATUS_BADGE = {
  expired: "bg-red-100 text-red-800",
  urgent: "bg-orange-100 text-orange-800",
  "use-soon": "bg-yellow-100 text-yellow-800",
};

const daysLabel = (days) =>
  days < 0 ? `Expired ${-days} day(s) ago` : days === 0 ? "Expires today" : `${days} day(s) left`;

function AIAssistant({ lists, onBack, onAddItems, onCreateList, onUpdateItem }) {
  const [tab, setTab] = useState("recommendations");
  const [inventory, setInventory] = useState([]);
  const [householdSize, setHouseholdSize] = useState(2);
  const [prompts, setPrompts] = useState({}); // request text per tab
  const [targetListId, setTargetListId] = useState(lists[0]?.id || "");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Module 3 inventory (stored in this browser)
  useEffect(() => {
    listRecords("inventory")
      .then(setInventory)
      .catch(() => setInventory([]));
  }, []);

  const activeTab = TABS.find((t) => t.id === tab);
  const targetList = lists.find((list) => list.id === targetListId);
  const prompt = prompts[tab] || "";
  const setPrompt = (text) => setPrompts((prev) => ({ ...prev, [tab]: text }));

  const run = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    setResult(null);
    try {
      const data = await runAIFeature(tab, {
        inventory,
        householdSize,
        prompt: prompt.trim(),
        listId: tab === "quantities" ? targetListId : "",
      });
      setResult(data);
      setSelected((data.items || []).map((_, index) => index));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (id) => {
    setTab(id);
    setResult(null);
    setMessage({ type: "", text: "" });
  };

  const toggle = (index) =>
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );

  const chosenItems = () =>
    (result?.items || [])
      .filter((_, index) => selected.includes(index))
      .map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        priority: item.priority,
        notes: item.reason ? `AI: ${item.reason}` : "",
      }));

  const addToList = async () => {
    const items = chosenItems();
    if (!targetListId || items.length === 0) return;
    try {
      await onAddItems(targetListId, items);
      setMessage({ type: "success", text: `Added ${items.length} item(s) to "${targetList?.name}".` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const createList = async () => {
    const items = chosenItems();
    if (items.length === 0) return;
    try {
      const list = await onCreateList(result.listName || "AI Shopping List", items);
      setTargetListId(list.id);
      setMessage({ type: "success", text: `Created "${list.name}" with ${items.length} item(s).` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Recipes: add the ingredients you still need to buy to the chosen list
  const addMissingIngredients = async (recipe) => {
    const items = recipe.ingredients
      .filter((ing) => !ing.available)
      .map((ing) => ({
        name: ing.name,
        category: "Other",
        quantity: 1,
        unit: "pcs",
        priority: "Medium",
        notes: `For ${recipe.title}${ing.quantity && ing.quantity !== "as needed" ? ` (needs ${ing.quantity})` : ""}`,
      }));
    if (!targetListId || items.length === 0) return;
    try {
      await onAddItems(targetListId, items);
      setMessage({ type: "success", text: `Added ${items.length} ingredient(s) for "${recipe.title}" to "${targetList?.name}".` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Smart quantities: update matching pending items in the chosen list
  const applyQuantities = async () => {
    if (!targetList) return;
    let updated = 0;
    try {
      for (const [index, suggestion] of (result?.items || []).entries()) {
        if (!selected.includes(index)) continue;
        const item = targetList.items.find(
          (i) => !i.completed && i.name.toLowerCase() === suggestion.name.toLowerCase()
        );
        if (!item) continue;
        await onUpdateItem(targetList.id, item.id, {
          quantity: suggestion.quantity,
          unit: suggestion.unit,
        });
        updated += 1;
      }
      setMessage({ type: "success", text: `Updated ${updated} item(s) in "${targetList.name}".` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const listSelect = (
    <select
      value={targetListId}
      onChange={(e) => setTargetListId(e.target.value)}
      className="border border-gray-300 rounded-md px-2 py-2 text-sm"
    >
      {lists.length === 0 && <option value="">No lists yet</option>}
      {lists.map((list) => (
        <option key={list.id} value={list.id}>
          {list.name}
        </option>
      ))}
    </select>
  );

  return (
    <ModuleShell title="AI Grocery Assistant" icon="fa-robot" onBack={onBack}>
      {/* Feature tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition duration-300 ${
              tab === t.id
                ? "bg-emerald-600 text-white"
                : "bg-white text-emerald-700 border border-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <i className={`fas ${t.icon} mr-1`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <p className="text-gray-600 mb-4">{activeTab.hint}</p>

        {/* Free-text request, sent to Gemini */}
        <label className="block text-sm text-gray-700 mb-2" htmlFor="ai-prompt">
          <span className="block font-bold mb-1">{activeTab.ask}</span>
          <input
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) run();
            }}
            maxLength={500}
            placeholder={`e.g. ${activeTab.examples[0]}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {activeTab.examples.map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => setPrompt(example)}
              className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm text-gray-700">
            <span className="block font-bold mb-1">Household size</span>
            <input
              type="number"
              min="1"
              max="12"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md"
            />
          </label>

          {(tab === "quantities" || tab === "recipes") && (
            <label className="text-sm text-gray-700">
              <span className="block font-bold mb-1">
                {tab === "recipes" ? "Add missing ingredients to" : "List"}
              </span>
              {listSelect}
            </label>
          )}

          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>Thinking...
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles mr-1"></i>Get suggestions
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Using {lists.length} list(s) and {inventory.length} inventory item(s).
        </p>
      </div>

      {message.text && (
        <p className={`mb-4 text-sm ${message.type === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {message.text}
        </p>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                result.source === "gemini" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              {result.source === "gemini" ? (
                <>
                  <i className="fas fa-wand-magic-sparkles mr-1"></i>Gemini AI
                </>
              ) : (
                "Smart rules (fallback)"
              )}
            </span>
            <p className="text-gray-700">{result.summary}</p>
          </div>
          {result.fallback && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
              <i className="fas fa-triangle-exclamation mr-1"></i>
              {result.note || "Gemini AI is unavailable, so smart-rules results are shown."}
            </div>
          )}

          {/* Item suggestions */}
          {result.items?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="divide-y">
                {result.items.map((item, index) => (
                  <label key={`${item.name}-${index}`} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(index)}
                      onChange={() => toggle(index)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {item.name}
                        <span className="text-sm text-gray-500 ml-2">
                          {item.quantity} {item.unit} • {item.category}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{item.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_BADGE[item.priority] || PRIORITY_BADGE.Medium}`}>
                      {item.priority}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
                {tab === "quantities" ? (
                  <button
                    type="button"
                    onClick={applyQuantities}
                    disabled={selected.length === 0 || !targetList}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Apply quantities to "{targetList?.name || "list"}"
                  </button>
                ) : (
                  <>
                    {tab === "generate-list" && (
                      <button
                        type="button"
                        onClick={createList}
                        disabled={selected.length === 0}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Create new list "{result.listName || "AI Shopping List"}"
                      </button>
                    )}
                    <span className="text-sm text-gray-600">Add selected to</span>
                    {listSelect}
                    <button
                      type="button"
                      onClick={addToList}
                      disabled={selected.length === 0 || !targetListId}
                      className="bg-white text-emerald-700 border border-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 disabled:opacity-60"
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Add {selected.length} item(s)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Expiry and food-waste tips */}
          {result.tips?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.tips.map((tip, index) => (
                <div key={`${tip.item}-${index}`} className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{tip.item}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[tip.status] || STATUS_BADGE["use-soon"]}`}>
                      {daysLabel(tip.daysLeft)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{tip.tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recipe ideas */}
          {result.recipes?.length > 0 && (
            <div>
              {tab === "waste-tips" && (
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Recipes to use them up</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.recipes.map((recipe, index) => (
                  <div key={`${recipe.title}-${index}`} className="bg-white p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-800">{recipe.title}</h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        <i className="fas fa-clock mr-1"></i>
                        {recipe.time}
                      </span>
                    </div>
                    {recipe.servings && (
                      <p className="text-xs text-gray-500 mb-1">
                        <i className="fas fa-user-group mr-1"></i>
                        Serves {recipe.servings}
                      </p>
                    )}
                    <p className="text-xs text-emerald-700 mb-2">{recipe.reason}</p>

                    {recipe.ingredients?.length > 0 ? (
                      <ul className="text-sm space-y-1 mb-2">
                        {recipe.ingredients.map((ing, ingIndex) => (
                          <li key={`${ing.name}-${ingIndex}`} className={ing.available ? "text-emerald-700" : "text-gray-600"}>
                            <i className={`fas ${ing.available ? "fa-check" : "fa-cart-shopping"} mr-2 text-xs`}></i>
                            {ing.name}
                            {ing.quantity && <span className="text-gray-400"> - {ing.quantity}</span>}
                            {!ing.available && <span className="text-xs text-gray-400"> (to buy)</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">You have:</span> {recipe.uses?.join(", ") || "-"}
                        </p>
                        {recipe.missing?.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">To buy:</span> {recipe.missing.join(", ")}
                          </p>
                        )}
                      </>
                    )}

                    <ol className="list-decimal list-inside text-sm text-gray-500 mt-2 space-y-1">
                      {recipe.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>

                    {recipe.ingredients?.some((ing) => !ing.available) && (
                      <button
                        type="button"
                        onClick={() => addMissingIngredients(recipe)}
                        disabled={!targetListId}
                        className="mt-3 text-sm bg-white text-emerald-700 border border-emerald-600 px-3 py-1.5 rounded-full hover:bg-emerald-50 disabled:opacity-60"
                      >
                        <i className="fas fa-plus mr-1"></i>
                        Add missing to "{targetList?.name || "list"}"
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result.items?.length && !result.tips?.length && !result.recipes?.length && (
            <p className="text-gray-400">No suggestions right now. Add more items to your lists or inventory and try again.</p>
          )}
        </div>
      )}
    </ModuleShell>
  );
}

export default AIAssistant;
