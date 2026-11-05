const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

module.exports = mongoose.model('List', new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: ObjectId, ref: 'User', required: true },
  items: [{
    name: { type: String, required: true },
    category: { type: String, default: 'Other' },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'pcs' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    notes: String,
    completed: { type: Boolean, default: false },
    assignedTo: { type: ObjectId, ref: 'User', default: null }      // Module 4
  }],
  collaborators: [{                                                   // Module 4
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor'], default: 'editor' }
  }]
}, { timestamps: true }));