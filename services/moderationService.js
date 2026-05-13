const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODERATION_PROMPT = `You are a content moderator for PosomePa, a property rental platform in India. 

Analyze the following message and determine if it violates any of these rules:
1. Contains phone numbers in any format (spaced, dashed, spelled out, mixed with words, in Hindi/regional languages)
2. Contains email addresses or email service names
3. Contains social media references (instagram, whatsapp, telegram, snapchat, the green app etc)
4. Attempts to move conversation off-platform (book directly, call me, contact outside etc)
5. Contains off-platform payment requests (gpay, paytm, cash payment, bank transfer etc)
6. Contains sexual content, harassment, or inappropriate language
7. Contains hate speech, threats, or abusive language
8. Contains personal identifying information (address, Aadhaar, PAN etc)
9. Is spam, gibberish, or completely irrelevant to property rental
10. Attempts to bypass rules using Hindi, regional languages, or coded language

Respond ONLY with a JSON object in this exact format, nothing else:
{
  "allowed": true or false,
  "reason": "brief user-friendly reason if not allowed, empty string if allowed",
  "category": "contact_info|social_media|off_platform|payment|inappropriate|hate_speech|personal_info|spam|clean"
}`;

exports.moderateMessage = async (content) => {
  const basicPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, 
    /gmail|yahoo|hotmail|outlook|protonmail|icloud|rediff/i, 
    /\b\d{10}\b/, 
    /\+91\s?\d{10}/gi,
    /\b9[78]\d{9}\b/, 
    /\b\d{5,}\b/, 
    /\d\s\d\s\d\s\d\s\d\s\d/, 
    /instagram|whatsapp|telegram|snapchat|facebook|twitter|linkedin/i,
    /\big\b(?!ore)/i, /\bwa\b(?!it)/i, /\bwp\b(?!ean)/i,
    /\btg\b/i, /\bsc\b/i, /\btt\b/i, /\bfb\b/i, /yt|youtube/i,
    /gpay|google\s?pay|paytm|phonepe|bhim|upi|neft|imps/i,
    /book\s?outside|book\s?directly|call\s?me|give\s?me\s?a\s?call/i,
  ];

  for (const pattern of basicPatterns) {
    if (pattern.test(content)) {
      return { allowed: false, reason: 'Message contains restricted content. Please remove contact info, social media, or payment references.', category: 'contact_info' };
    }
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: MODERATION_PROMPT },
        { role: 'user', content: `Message to moderate: "${content}"` }
      ],
      model: 'llama3-8b-8192',
      temperature: 0,
      max_tokens: 150,
      timeout: 10000, 
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.warn('Groq returned empty response, allowing message');
      return { allowed: true, reason: '', category: 'clean' };
    }

    return JSON.parse(response);
  } catch (error) {
    console.error('Moderation error (Groq failed):', error.message);
    return { allowed: true, reason: '', category: 'clean', fallback: true };
  }
};
