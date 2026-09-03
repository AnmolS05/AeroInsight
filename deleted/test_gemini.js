const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    console.log('Testing Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, are you there?'
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

test();
