const generateDescription = async (title, category, condition) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const isArabic = /[\u0600-\u06FF]/.test(title);

    const prompt = `Write a short friendly description (2-3 sentences) for this donation item:
Title: ${title}
Category: ${category}
Condition: ${condition}

${isArabic ? 'Write the description in Arabic.' : 'Write the description in English.'}
Return ONLY the description text. Be warm and welcoming.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API failed");

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No description generated");

    return text;
  } catch (error) {
    console.error("❌ Description Error:", error.message);
    throw new Error(error.message);
  }
};

const detectCategory = async (title, description = "") => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const prompt = `Choose ONE category for this donation item:
clothing, electronics, furniture, books, education, food, healthcare, other

Title: ${title}
${description ? `Description: ${description}` : ''}

Return ONLY the category name in lowercase (one word).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API failed");

    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    const valid = ['clothing', 'electronics', 'furniture', 'books', 'education', 'food', 'healthcare', 'other'];

    return valid.includes(category) ? category : 'other';
  } catch (error) {
    console.error("❌ Category Error:", error.message);
    throw new Error(error.message);
  }
};

const detectCondition = async (title, description = "") => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const prompt = `Determine the condition: new OR good
Title: ${title}
${description ? `Description: ${description}` : ''}
Return ONLY one word.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API failed");

    const condition = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    return (condition === 'new' || condition === 'good') ? condition : 'good';
  } catch (error) {
    console.error("❌ Condition Error:", error.message);
    throw new Error(error.message);
  }
};

const generateFromTitle = async (title) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const pixabayKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found");

    const isArabic = /[\u0600-\u06FF]/.test(title);
    const lang = isArabic ? 'Arabic' : 'English';

    const prompt = `Analyze this donation item: "${title}"

Return ONLY a valid JSON object (no markdown):
{
  "description": "${isArabic ? 'وصف ودود مناسب بالعربية، 2-3 جمل' : 'warm friendly 2-3 sentences in English'}",
  "category": "ONE of: clothing, electronics, furniture, books, education, food, healthcare, other",
  "condition": "either: new OR good",
  "imageKeyword": "1-2 English keywords for image search (e.g. laptop, smartphone, book)"
}

The description MUST be in ${lang}. Return ONLY the JSON.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API failed");

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
    const result = JSON.parse(cleanText);

   // ✅ Get image from Pixabay
    let imageDataUrl = null;

    try {
      console.log("🖼️ Fetching image from Pixabay...");
      const keyword = encodeURIComponent(result.imageKeyword);
      const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${keyword}&image_type=photo&per_page=20&safesearch=true`;

      const pixabayResponse = await fetch(pixabayUrl);
      const pixabayData = await pixabayResponse.json();

      if (pixabayData.hits && pixabayData.hits.length > 0) {
        // ✅ Pick RANDOM image from results (not always first)
        const randomIndex = Math.floor(Math.random() * Math.min(pixabayData.hits.length, 10));
        const imageUrl = pixabayData.hits[randomIndex].webformatURL;
        console.log(`📸 Image URL (${randomIndex + 1}/${pixabayData.hits.length}):`, imageUrl);

        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          imageDataUrl = `data:image/jpeg;base64,${base64}`;
          console.log("✅ Image fetched!");
        }
      } else {
        console.log("⚠️ No images found in Pixabay");
      }
    } catch (imageError) {
      console.log("⚠️ Image fetch failed:", imageError.message);
    }
    return {
      description: result.description,
      category: result.category,
      condition: result.condition,
      image: imageDataUrl,
      language: lang
    };
  } catch (error) {
    console.error("❌ Generate From Title Error:", error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  generateDescription,
  detectCategory,
  detectCondition,
  generateFromTitle
};