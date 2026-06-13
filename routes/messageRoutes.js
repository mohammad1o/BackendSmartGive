const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getConversation, getMyConversations, deleteConversation } = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/', protect, getMyConversations);
router.delete('/conversation/:userId', protect, deleteConversation);
router.get('/:userId', protect, getConversation);

module.exports = router;