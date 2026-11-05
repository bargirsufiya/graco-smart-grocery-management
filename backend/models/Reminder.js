const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

module.exports = mongoose.model('Reminder', new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  list: { type: ObjectId, ref: 'List' },
  message: { type: String, required: true },
  remindAt: { type: Date, required: true },
  sent: { type: Boolean, default: false }
}, { timestamps: true }));