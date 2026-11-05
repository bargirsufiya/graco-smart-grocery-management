const Reminder = require('../models/Reminder');

exports.create = async (req, res) => {
  try {
    const { listId, message, remindAt } = req.body;
    if (new Date(remindAt) <= new Date())
      return res.status(400).json({ msg: 'Pick a future time' });

    const r = await Reminder.create({ user: req.user.id, list: listId, message, remindAt });
    res.status(201).json(r);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
};

exports.getMine = async (req, res) => {
  res.json(await Reminder.find({ user: req.user.id, sent: false }).sort({ remindAt: 1 }));
};

exports.remove = async (req, res) => {
  await Reminder.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ msg: 'Reminder deleted' });
};