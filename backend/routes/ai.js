const router = require("express").Router();
const auth = require("../middleware/auth");
const List = require("../models/List");
const { runFeature, FEATURES } = require("../services/aiService");

// POST /api/ai/:feature
// feature: recommendations | quantities | recipes | generate-list | waste-tips
// body: { inventory?: [], householdSize?: number, prompt?: string, listId?: string }
// prompt is the user's own request in plain language, e.g. "5 dinner recipes for 4 people"
router.post("/:feature", auth, async (req, res) => {
  const { feature } = req.params;
  if (!FEATURES.includes(feature)) {
    return res.status(404).json({ message: "Unknown AI feature" });
  }

  try {
    const body = req.body || {};

    // Lists come from MongoDB: the user's own lists plus lists shared with them
    const lists = await List.find({
      $or: [{ owner: req.user.id }, { "collaborators.user": req.user.id }],
    }).lean();

    // Inventory is kept in the browser by Module 3, so the client sends it
    const inventory = (Array.isArray(body.inventory) ? body.inventory : [])
      .filter((item) => item && typeof item.name === "string" && item.name.trim())
      .slice(0, 200);

    const householdSize = Math.min(12, Math.max(1, parseInt(body.householdSize, 10) || 2));
    // "goal" is the older field name for the same free-text request
    const rawPrompt = typeof body.prompt === "string" ? body.prompt : body.goal;
    const prompt = typeof rawPrompt === "string" ? rawPrompt.trim().slice(0, 500) : "";
    const listId = typeof body.listId === "string" ? body.listId : "";

    const result = await runFeature(feature, { lists, inventory, householdSize, prompt, goal: prompt, listId });
    res.json(result);
  } catch (err) {
    console.error("AI route error:", err.message);
    res.status(500).json({ message: "Unable to generate suggestions right now" });
  }
});

module.exports = router;
