const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllUsers, deleteUser, getAllItems, deleteAnyItem, getAllRequests } = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/items', getAllItems);
router.delete('/items/:id', deleteAnyItem);
router.get('/requests', getAllRequests);

module.exports = router;
