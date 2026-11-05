const List = require('../models/List');

// Usage: access()  -> owner or any collaborator
//        access('editor') -> owner or editor only
module.exports = (minRole = 'viewer') => async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ msg: 'List not found' });

    const uid = req.user.id;
    const isOwner = list.owner.toString() === uid;
    const collab = list.collaborators.find(c => c.user.toString() === uid);

    if (!isOwner && !collab) return res.status(403).json({ msg: 'No access to this list' });
    if (minRole === 'editor' && !isOwner && collab.role !== 'editor')
      return res.status(403).json({ msg: 'Editor access required' });

    req.list = list;
    req.isOwner = isOwner;
    req.role = isOwner ? 'owner' : collab.role;
    next();
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};