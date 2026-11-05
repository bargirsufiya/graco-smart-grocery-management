const List = require('../models/List');

exports.getMyLists = async (req, res) => {
  res.json(await List.find({ owner: req.user.id }).sort({ createdAt: -1 }));
};

exports.createList = async (req, res) => {
  const list = await List.create({ name: req.body.name, owner: req.user.id });
  res.status(201).json(list);
};

exports.getList = (req, res) => {
  res.json({ ...req.list.toObject(), myRole: req.role });
};

// Rename a list (owner only)
exports.renameList = async (req, res) => {
  if (!req.isOwner) return res.status(403).json({ msg: 'Only the owner can rename this list' });
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ msg: 'List name is required' });
  req.list.name = name;
  await req.list.save();
  res.json({ ...req.list.toObject(), myRole: req.role });
};

exports.deleteList = async (req, res) => {
  if (!req.isOwner) return res.status(403).json({ msg: 'Only owner can delete' });
  await req.list.deleteOne();
  res.json({ msg: 'List deleted' });
};

exports.addItem = async (req, res) => {
  req.list.items.push(req.body);
  await req.list.save();
  res.status(201).json(req.list);
};

exports.toggleItem = async (req, res) => {
  const item = req.list.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ msg: 'Item not found' });
  item.completed = !item.completed;
  await req.list.save();
  res.json(req.list);
};

// Edit an item's details (used by the Module 2 edit form)
exports.updateItem = async (req, res) => {
  const item = req.list.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ msg: 'Item not found' });
  for (const field of ['name', 'category', 'quantity', 'unit', 'priority', 'notes', 'completed']) {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  }
  await req.list.save();
  res.json(req.list);
};

exports.deleteItem = async (req, res) => {
  req.list.items.pull(req.params.itemId);
  await req.list.save();
  res.json(req.list);
};