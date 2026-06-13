const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },

    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },

    locationId: {
      type: String
    },

    joinedMonth: {
      type: Number
    },

    joinedYear: {
      type: Number
    },

    bio: {
      type: String,
      default: ''
    },

    avatar: {
      type: String,
      default: ''
    },
    isAnonymous: {
  type: Boolean,
  default: false
},
    isVerified: {
  type: Boolean,
  default: false
},
verificationCode: String,
verificationCodeExpire: Date,

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);