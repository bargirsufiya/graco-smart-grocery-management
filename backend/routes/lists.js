const router = require('express').Router();
const auth = require('../middleware/auth');
const access = require('../middleware/listAccess');
const list = require('../controllers/listController');
const share = require('../controllers/shareController');

// Module 4 (keep ABOVE '/:id')
router.get('/shared-with-me', auth, share.sharedWithMe);

// Basic list CRUD
router.get('/', auth, list.getMyLists);
router.post('/', auth, list.createList);
router.get('/:id', auth, access(), list.getList);
router.put('/:id', auth, access(), list.renameList);
router.delete('/:id', auth, access(), list.deleteList);
router.post('/:id/items', auth, access('editor'), list.addItem);
router.put('/:id/items/:itemId/toggle', auth, access('editor'), list.toggleItem);
router.put('/:id/items/:itemId', auth, access('editor'), list.updateItem);
router.delete('/:id/items/:itemId', auth, access('editor'), list.deleteItem);

// Module 4: sharing and assigning
router.get('/:id/collaborators', auth, access(), share.getCollaborators);
router.post('/:id/share', auth, access(), share.shareList);
router.delete('/:id/share/:userId', auth, access(), share.unshare);
router.put('/:id/items/:itemId/assign', auth, access('editor'), share.assignItem);

module.exports = router;