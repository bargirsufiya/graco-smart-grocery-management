const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, name }
  } catch {
    return res.status(401).json({ msg: 'Invalid token' });
  }

  // Tokens issued before the name was added only carry { id }
  if (!req.user.name) {
    const user = await User.findById(req.user.id).select('name');
    if (!user) return res.status(401).json({ msg: 'User no longer exists' });
    req.user.name = user.name;
  }
  next();
};
