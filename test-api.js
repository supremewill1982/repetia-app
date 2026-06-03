const axios = require('axios');

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testAPI() {
  try {
    console.log('🔍 Test de l\'API OpenRouter...');
    const response = await axios.post(API_URL, {
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'user', content: 'Dis "Bonjour" en français' }
      ],
      max_tokens: 50,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ API fonctionne:', response.data.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
  }
}

testAPI();
