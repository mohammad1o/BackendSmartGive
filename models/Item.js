const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },

  images: [{
    type: String
  }],

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'clothing',
      'electronics',
      'furniture',
      'books',
      'education',
      'food',
      'healthcare',
      'other'
    ]
  },

  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new','good']
  },

  status: {
    type: String,
    enum: ['available', 'reserved', 'given'],
    default: 'available'
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },

  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);