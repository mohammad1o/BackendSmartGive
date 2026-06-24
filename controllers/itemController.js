const Item = require('../models/Item');

/* =========================
   CREATE ITEM
========================= */
const createItem = async (req, res) => {
  try {
    req.body.owner = req.user._id;
    const item = await Item.create(req.body);
    res.status(201).json({
      success: true,
      item
    });
  } catch (error) {
    const errorMessages = error.errors 
      ? Object.values(error.errors).map(e => e.message).join(', ')
      : error.message;

    res.status(400).json({
      success: false,
      message: errorMessages,
      details: error.errors || null
    });
  }
};

/* =========================
   GET ALL ITEMS (PUBLIC)
========================= */
const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('owner', 'name email avatar isAnonymous');

    // ✅ Anonymize users
    items.forEach(item => {
      if (item.owner && item.owner.isAnonymous) {
        item.owner.name = 'Anonymous User';
        item.owner.avatar = '';
      }
    });

    res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET SINGLE ITEM
========================= */
const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name email avatar isAnonymous');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // ✅ Anonymize owner
    const requesterId = req.user?._id?.toString();
const ownerId = item.owner?._id?.toString();
if (item.owner && item.owner.isAnonymous && requesterId !== ownerId) {
  item.owner.name = 'Anonymous User';
  item.owner.avatar = '';
}

    res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET USER ITEMS (MY ITEMS)
========================= */
const getUserItems = async (req, res) => {
  try {
    // ✅ Don't anonymize - this is the user's OWN items
    const items = await Item.find({ owner: req.user._id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   UPDATE ITEM
========================= */
const updateItem = async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (
      item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    delete req.body.owner;
    delete req.body.reservedBy;
    delete req.body.status;

    item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   DELETE ITEM
========================= */
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (
      item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createItem,
  getItems,
  getItem,
  getUserItems,
  updateItem,
  deleteItem
};