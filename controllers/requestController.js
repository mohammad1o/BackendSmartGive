const Request = require('../models/Request');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

/* =========================
   CREATE REQUEST
========================= */
const createRequest = async (req, res) => {
  try {
    const { itemId, message } = req.body;

    const item = await Item.findById(itemId);
    if (!item)
      return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.status !== 'available')
      return res.status(400).json({ success: false, message: 'Item is not available' });

    if (item.owner.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot request your own item' });

    const existing = await Request.findOne({
      item: itemId,
      requester: req.user._id,
      status: 'pending'
    });

    if (existing)
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this item'
      });

    const request = await Request.create({
      item: itemId,
      requester: req.user._id,
      message
    });

    await Notification.create({
      recipient: item.owner,
      type: 'request_received',
      message: `${req.user.name} wants your item: ${item.title}`,
      relatedItem: item._id,
      relatedRequest: request._id
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET USER REQUESTS (Sent by me)
========================= */
const getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('item', 'title images status')
      .populate('requester', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET INCOMING REQUESTS (Requests on my items)
========================= */
const getIncomingRequests = async (req, res) => {
  try {
    const myItems = await Item.find({ owner: req.user._id }).select('_id');
    const itemIds = myItems.map(item => item._id);

    const requests = await Request.find({
      item: { $in: itemIds },
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('item', 'title images status')
      .populate('requester', 'name email isAnonymous')  // ✅ ADD isAnonymous
      .sort('-createdAt');

    // ✅ Anonymize requesters
    requests.forEach(req => {
      if (req.requester && req.requester.isAnonymous) {
        req.requester.name = 'Anonymous User';
        req.requester.email = '';
      }
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/* =========================
   GET ITEM REQUESTS
========================= */
const getItemRequests = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item)
      return res.status(404).json({ success: false, message: 'Item not found' });

    if (
      item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const requests = await Request.find({ item: req.params.itemId })
      .populate('requester', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   ACCEPT REQUEST
========================= */
/* =========================
   ACCEPT REQUEST (= GIVEN directly)
========================= */
const acceptRequest = async (req, res) => {
  try {
    const Message = require('../models/Message');  // ✅ Import

    const request = await Request.findById(req.params.id)
      .populate('item')
      .populate('requester', 'name');

    if (!request)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (
      request.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'pending')
      return res.status(400).json({
        success: false,
        message: 'Request is already ' + request.status
      });

    // ✅ Accept this request
    request.status = 'accepted';
    await request.save();

    // ✅ Mark item as GIVEN (not reserved)
    request.item.status = 'given';
    await request.item.save();

    // ✅ Reject ALL other pending requests
    const rejectedRequests = await Request.find({
      item: request.item._id,
      _id: { $ne: request._id },
      status: 'pending'
    });

    await Request.updateMany(
      {
        item: request.item._id,
        _id: { $ne: request._id },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    // ✅ DELETE all messages related to this item
    const deletedMessages = await Message.deleteMany({ item: request.item._id });
    console.log(`🗑️ Deleted ${deletedMessages.deletedCount} messages for item ${request.item._id}`);

    // ✅ Notification for accepted requester
    await Notification.create({
      recipient: request.requester._id,
      type: 'request_accepted',
      message: `Your request for "${request.item.title}" was accepted! The item is yours.`,
      relatedItem: request.item._id,
      relatedRequest: request._id
    });

    // ✅ Notification for rejected requesters
    for (const rejected of rejectedRequests) {
      await Notification.create({
        recipient: rejected.requester,
        type: 'request_rejected',
        message: `Your request for "${request.item.title}" was rejected because the item has been given to another user`,
        relatedItem: request.item._id,
        relatedRequest: rejected._id
      });
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   REJECT REQUEST
========================= */
const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('item')
      .populate('requester', 'name');

    if (!request)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (
      request.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'pending')
      return res.status(400).json({
        success: false,
        message: 'Request is already ' + request.status
      });

    request.status = 'rejected';
    await request.save();

    await Notification.create({
      recipient: request.requester._id,
      type: 'request_rejected',
      message: `Your request for "${request.item.title}" was rejected`,
      relatedItem: request.item._id,
      relatedRequest: request._id
    });

    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   CANCEL REQUEST
========================= */
const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request)
      return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.requester.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (request.status !== 'pending')
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a ' + request.status + ' request'
      });

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  createRequest,
  getUserRequests,
  getIncomingRequests,
  getItemRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};