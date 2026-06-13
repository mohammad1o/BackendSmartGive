const { 
  generateDescription, 
  detectCategory, 
  detectCondition,
  generateFromTitle
} = require('../services/geminiService');

const generateItemDescription = async (req, res) => {
  try {
    const { title, category, condition } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const description = await generateDescription(
      title,
      category || 'general',
      condition || 'good'
    );

    res.status(200).json({
      success: true,
      description
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const detectItemCategory = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const category = await detectCategory(title, description);

    res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const detectItemCondition = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const condition = await detectCondition(title, description);

    res.status(200).json({
      success: true,
      condition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const autoFillFromTitle = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const result = await generateFromTitle(title);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
const searchItems = async (req, res) => {
  try {
    const { query } = req.body;
    const Item = require('../models/Item');

    // ✅ Step 1: Ask Gemini to translate/extract search keyword in English
    const translateResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Extract the main item/product keyword from this text and translate it to English. Return ONLY the English keyword, nothing else, no explanation.\nText: "${query}"`
          }]
        }]
      })
    });

    const translateData = await translateResponse.json();
    const englishKeyword = translateData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || query;

    // ✅ Step 2: Search DB with both original and translated keyword
    const items = await Item.find({
      status: 'available',
      $or: [
        { title: { $regex: englishKeyword, $options: 'i' } },
        { description: { $regex: englishKeyword, $options: 'i' } },
        { category: { $regex: englishKeyword, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ]
    }).limit(3);

    const isArabic = /[\u0600-\u06FF]/.test(query);

    let prompt;
    if (items.length > 0) {
      const itemsList = items.map(i => `- ${i.title}`).join('\n');
      prompt = isArabic
        ? `أنت مساعد تبرعات. المستخدم يبحث عن "${query}". وجدنا:\n${itemsList}\nاكتب رسالة قصيرة جداً (سطرين) بالعربي. بدون markdown.`
        : `You are a donation assistant. User searched for "${query}". Found:\n${itemsList}\nWrite a very short message (2 lines) in English. No markdown.`;
    } else {
      prompt = isArabic
        ? `أنت مساعد تبرعات. المستخدم يبحث عن "${query}" ولا يوجد شيء. اكتب رسالة قصيرة (سطر واحد) بالعربي تمنى له حظاً أوفر. بدون markdown.`
        : `You are a donation assistant. User searched for "${query}" but nothing found. Write a very short message (1 line) in English wishing better luck. No markdown.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}/g, '').trim();

    res.status(200).json({ success: true, message: text, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateItemDescription,
  detectItemCategory,
  detectItemCondition,
  autoFillFromTitle,
  searchItems 
};