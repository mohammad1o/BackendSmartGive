const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

/* =========================
   COOKIE OPTIONS
========================= */
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

/* =========================
   GENERATE JWT
========================= */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/* =========================
   SEND TOKEN RESPONSE
========================= */
const sendTokenCookie = (res, user, statusCode) => {
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
       phone: user.phone,             
      locationId: user.locationId,    
      joinedMonth: user.joinedMonth,  
      joinedYear: user.joinedYear,    
      bio: user.bio,                  
      avatar: user.avatar,
      isAnonymous: user.isAnonymous
    }
  });
};

/* =========================
   REGISTER
========================= */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, locationId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpire = Date.now() + 10 * 60 * 1000;

    // ✨ Auto-set join date
    const now = new Date();

    const user = await User.create({
      name,
      email,
      password,
      phone,
      locationId,
      joinedMonth: now.getMonth() + 1,  // ✨ AUTO
      joinedYear: now.getFullYear(),     // ✨ AUTO
      verificationCode,
      verificationCodeExpire,
      isVerified: false
    });

    try {
      await sendVerificationEmail(email, name, verificationCode);
      console.log("✅ Verification email sent");
    } catch (emailError) {
      console.error("⚠️ Email failed:", emailError.message);
    }

    res.clearCookie('token', cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Account created! Check your email for verification code.',
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   LOGIN
========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ✅ Block unverified users
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    sendTokenCookie(res, user, 200);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/* =========================
   LOGOUT
========================= */
const logout = async (req, res) => {
  try {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/* =========================
   GET ME
========================= */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        locationId: user.locationId,
        joinedMonth: user.joinedMonth,
        joinedYear: user.joinedYear,
        bio: user.bio,
        avatar: user.avatar,
         isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
const updateProfile = async (req, res) => {
  try {
    const { name, email, locationId, joinedMonth, joinedYear, bio, phone, avatar, isAnonymous } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name?.trim(),
        email: email?.toLowerCase().trim(),
        locationId,
        joinedMonth,
        joinedYear,
        bio,
        phone: String(phone)?.trim(),
        avatar,
        isAnonymous  
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        locationId: user.locationId,
        joinedMonth: user.joinedMonth,
        joinedYear: user.joinedYear,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        isAnonymous: user.isAnonymous  
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // ✅ Check at least 2 categories
    let strengthCount = 0;
    if (/[A-Z]/.test(newPassword)) strengthCount++;
    if (/[a-z]/.test(newPassword)) strengthCount++;
    if (/\d/.test(newPassword)) strengthCount++;
    if (/[@$!%*?&]/.test(newPassword)) strengthCount++;

    if (strengthCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 2 of: uppercase, lowercase, numbers, special characters'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Failed to update password'  // ✅ Generic message for security!
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update password'  // ✅ Generic message for security!
    });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, user.name, resetUrl);
    } catch (emailErr) {
      console.error("Email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Reset link sent to your email!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   RESET PASSWORD
========================= */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const Request = require('../models/Request');
    const requestsCount = await Request.countDocuments({ requester: user._id });

    // ✅ Check if user is anonymous
    const displayData = user.isAnonymous
      ? {
          id: user._id,
          name: 'Anonymous User',
          bio: '',
          avatar: '',
          locationId: null,
          joinedMonth: null,
          joinedYear: null,
          phone: '',
          createdAt: user.createdAt,
          requestsCount,
          isAnonymous: true
        }
      : {
          id: user._id,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          locationId: user.locationId,
          joinedMonth: user.joinedMonth,
          joinedYear: user.joinedYear,
          phone: user.phone,
          createdAt: user.createdAt,
          requestsCount,
          isAnonymous: false
        };

    res.status(200).json({
      success: true,
      user: displayData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const Item = require('../models/Item');
    const Request = require('../models/Request');
    const Message = require('../models/Message');
    const Notification = require('../models/Notification');

    // 1️⃣ Get user's items IDs
    const userItems = await Item.find({ owner: userId });
    const itemIds = userItems.map(item => item._id);

    // 2️⃣ Delete ALL requests ON user's items
    await Request.deleteMany({ item: { $in: itemIds } });

    // 3️⃣ Delete user's items
    await Item.deleteMany({ owner: userId });

    // 4️⃣ Delete user's own requests
    await Request.deleteMany({ requester: userId });

    // 5️⃣ Delete all messages
    await Message.deleteMany({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    // 6️⃣ Delete all notifications
    await Notification.deleteMany({
      $or: [
        { recipient: userId },
        { sender: userId }
      ]
    });

    // 7️⃣ Delete the user
    await User.findByIdAndDelete(userId);

    // 8️⃣ Clear the cookie
    res.clearCookie('token', cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Account and all data deleted successfully'
    });

  } catch (error) {
    console.error("❌ Delete account error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and code are required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (user.verificationCodeExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Code expired. Please request a new one.'
      });
    }

    // ✅ Mark as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! 🎉'
    });
  } catch (error) {
    console.error("❌ Verify email error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✨ Resend Verification Code
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send email
    await sendVerificationEmail(email, user.name, verificationCode);

    res.status(200).json({
      success: true,
      message: 'New verification code sent! 📧'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserById,
  deleteAccount,
   verifyEmail,  
  resendVerificationCode
};