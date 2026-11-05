const List = require('../models/List');
const User = require('../models/User');
const notify = require('../utils/notify');

// POST /api/lists/:id/share   body: { email, role }
exports.shareList = async (req, res) => {
  try {
    if (!req.isOwner)
      return res.status(403).json({ msg: 'Only the owner can share this list' });

    const { email, role = 'editor' } = req.body;
    const target = await User.findOne({ email: (email || '').toLowerCase().trim() });
    if (!target) return res.status(404).json({ msg: 'No user found with that email' });
    if (target._id.toString() === req.user.id)
      return res.status(400).json({ msg: "You can't share with yourself" });
    if (req.list.collaborators.some(c => c.user.equals(target._id)))
      return res.status(400).json({ msg: 'Already shared with this user' });

    req.list.collaborators.push({ user: target._id, role });
    await req.list.save();

    await notify(
      target._id, 'list_shared',
      `${req.user.name} shared "${req.list.name}" with you`, req.list._id
    );
    res.json({ msg: 'List shared' });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

// DELETE /api/lists/:id/share/:userId
exports.unshare = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.isOwner && userId !== req.user.id)
      return res.status(403).json({ msg: 'Not allowed' });

    req.list.collaborators = req.list.collaborators.filter(c => c.user.toString() !== userId);
    req.list.items.forEach(i => {
      if (i.assignedTo && i.assignedTo.toString() === userId) i.assignedTo = null;
    });
    await req.list.save();
    res.json({ msg: 'Access removed' });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

// GET /api/lists/:id/collaborators
exports.getCollaborators = async (req, res) => {
  try {
    const list = await List.findById(req.list._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
    res.json({ owner: list.owner, collaborators: list.collaborators, isOwner: req.isOwner });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

// GET /api/lists/shared-with-me
exports.sharedWithMe = async (req, res) => {
  try {
    res.json(await List.find({ 'collaborators.user': req.user.id }).populate('owner', 'name'));
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

// PUT /api/lists/:id/items/:itemId/assign   body: { userId }
exports.assignItem = async (req, res) => {
  try {
    const item = req.list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const { userId } = req.body;
    if (userId) {
      const allowed = [req.list.owner.toString(), ...req.list.collaborators.map(c => c.user.toString())];
      if (!allowed.includes(userId))
        return res.status(400).json({ msg: 'User is not part of this list' });
    }

    item.assignedTo = userId || null;
    await req.list.save();

    if (userId && userId !== req.user.id)
      await notify(
        userId, 'item_assigned',
        `${req.user.name} assigned you "${item.name}" in "${req.list.name}"`, req.list._id
      );

    res.json({ msg: 'Item assigned' });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};