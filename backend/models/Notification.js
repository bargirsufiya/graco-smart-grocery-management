const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['list_shared', 'item_assigned', 'reminder', 'pending_item', 'general'],
    default: 'general'
  },
  message: { type: String, required: true },
  list: { type: ObjectId, ref: 'List' },
  read: { type: Boolean, default: false }
}, { timestamps: true }));