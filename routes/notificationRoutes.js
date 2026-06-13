const router = require('express').Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);

router.get('/unread', protect, getUnreadNotifications);

router.put('/:id/read', protect, markNotificationRead);

router.put('/read-all', protect, markAllNotificationsRead);

module.exports = router;