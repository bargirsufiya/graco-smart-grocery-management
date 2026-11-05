const Notification = require('../models/Notification');
const List = require('../models/List');
const notify = require('../utils/notify');

// POST /api/notifications/check-pending
// Same check as the daily 9 AM job, run now for the logged-in user only.
exports.checkPending = async (req, res) => {
  const uid = req.user.id;
  const lists = await List.find({ $or: [{ owner: uid }, { 'collaborators.user': uid }] });

  let pending = 0;
  let created = 0;
  for (const l of lists) {
    for (const i of l.items.filter(x => !x.completed && x.priority === 'High')) {
      const mine = i.assignedTo ? i.assignedTo.toString() === uid : l.owner.toString() === uid;
      if (!mine) continue;
      pending += 1;

      const message = `High priority item "${i.name}" is still pending in "${l.name}"`;
      const exists = await Notification.exists({ user: uid, type: 'pending_item', message, read: false });
      if (!exists) {
        await notify(uid, 'pending_item', message, l._id);
        created += 1;
      }
    }
  }
  res.json({ pending, created });
};

exports.getMine = async (req, res) => {
  res.json(await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50));
};

exports.markRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ msg: 'Marked read' });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ msg: 'All marked read' });
};