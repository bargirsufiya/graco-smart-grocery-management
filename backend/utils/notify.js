const Notification = require('../models/Notification');

module.exports = (user, type, message, list = null) =>
  Notification.create({ user, type, message, list });