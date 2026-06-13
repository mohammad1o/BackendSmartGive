const User = require('../models/User');
const Item = require('../models/Item');
const Request = require('../models/Request');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin users' });

    await Item.deleteMany({ owner: user._id });
    await Request.deleteMany({ $or: [{ requester: user._id }, { item: { $in: (await Item.find({ owner: user._id })).map(i => i._id) } }] });
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate('owner', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAnyItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Item deleted by admin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('item', 'title')
      .populate('requester', 'name email')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, deleteUser, getAllItems, deleteAnyItem, getAllRequests };
