const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'request_received',
      'request_accepted',
      'request_rejected',
      'item_reserved',
      'item_given',
      'message_received'
    ]
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
