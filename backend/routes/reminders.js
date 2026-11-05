const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/reminderController');

router.post('/', auth, c.create);
router.get('/', auth, c.getMine);
router.delete('/:id', auth, c.remove);

module.exports = router;