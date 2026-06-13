const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

/* =========================
   SEND MESSAGE
========================= */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, itemId } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: text,
      item: itemId || null
    });

    // ✅ Create notification
    try {
      const sender = await User.findById(senderId);
      const senderName = sender?.isAnonymous ? 'Anonymous User' : (sender?.name || 'Someone');
      
      await Notification.create({
        recipient: receiverId,
        type: 'message_received',
        message: `${senderName} sent you a message`,
        relatedItem: itemId || null,
        read: false
      });
    } catch (notifErr) {
      console.warn("⚠️ Notification failed:", notifErr.message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET CONVERSATION (between 2 users, with optional item filter)
========================= */
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemId } = req.query;  // ✅ Optional item filter

    const query = {
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    };

    // ✅ Filter by item if provided
    if (itemId) {
      query.item = itemId;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name isAnonymous avatar')
      .populate('receiver', 'name isAnonymous avatar')
      .populate('item', 'title images status')
      .sort('createdAt');

    // ✅ Anonymize OTHER users (not yourself)
    const myId = req.user._id.toString();
    messages.forEach(msg => {
      if (msg.sender && msg.sender.isAnonymous && msg.sender._id.toString() !== myId) {
        msg.sender.name = 'Anonymous User';
        msg.sender.avatar = '';
      }
      if (msg.receiver && msg.receiver.isAnonymous && msg.receiver._id.toString() !== myId) {
        msg.receiver.name = 'Anonymous User';
        msg.receiver.avatar = '';
      }
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET ALL CONVERSATIONS (INBOX) - grouped by (user + item)
========================= */
const getMyConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('sender', 'name isAnonymous avatar')
      .populate('receiver', 'name isAnonymous avatar')
      .populate('item', 'title images status')
      .sort('-createdAt');

    const seen = new Map();
    const conversations = [];
    const myId = req.user._id.toString();

    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === myId
        ? msg.receiver
        : msg.sender;

      const otherId = otherUser._id.toString();
      const itemId = msg.item ? msg.item._id.toString() : 'no-item';

      // ✅ Group by (otherUser + item) - each item has its own conversation
      const key = `${otherId}-${itemId}`;

      if (!seen.has(key)) {
        seen.set(key, true);

        // ✅ Anonymize if needed
        let displayName = otherUser.name;
        let displayAvatar = otherUser.avatar || '';
        
        if (otherUser.isAnonymous) {
          displayName = 'Anonymous User';
          displayAvatar = '';
        }

        conversations.push({
          userId: otherId,
          userName: displayName,
          userAvatar: displayAvatar,
          item: msg.item ? {
            id: msg.item._id,
            title: msg.item.title,
            image: msg.item.images?.[0] || '',
            status: msg.item.status
          } : null,
          lastMessage: msg
        });
      }
    }

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemId } = req.query;

    const query = {
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    };

    if (itemId) {
      query.item = itemId;
    }

    const result = await Message.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} messages`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  sendMessage,
  getConversation,
  getMyConversations,
  deleteConversation
};