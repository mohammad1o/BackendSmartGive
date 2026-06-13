const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { createItem, getItems, getItem, getUserItems, updateItem, deleteItem } = require('../controllers/itemController');

router.get('/', getItems);
router.get('/mine', protect, getUserItems);
router.get('/:id', getItem);
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
