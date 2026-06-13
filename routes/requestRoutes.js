const router = require('express').Router();

const { protect } = require('../middleware/authMiddleware');

const {
  createRequest,
  getUserRequests,
  getIncomingRequests,
  getItemRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  markGiven
} = require('../controllers/requestController');

// POST - Create a new request
router.post('/', protect, createRequest);

// GET - Get my sent requests
router.get('/mine', protect, getUserRequests);

// GET - Get incoming requests (on my items)
router.get('/incoming/mine', protect, getIncomingRequests);

// GET - Get requests for specific item
router.get('/item/:itemId', protect, getItemRequests);

// PUT - Accept request
router.put('/:id/accept', protect, acceptRequest);

// PUT - Reject request
router.put('/:id/reject', protect, rejectRequest);

// PUT - Cancel request
router.put('/:id/cancel', protect, cancelRequest);


module.exports = router;