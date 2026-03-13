/**
 * Thorough Groq API test: send a medical question and validate the response.
 * Run: node scripts/test-groq-medical.cjs
 */
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) process.env[key] = val;
  });
}

const nextEnv = path.join(__dirname, '..', '.env.local');
const apiEnv = path.join(__dirname, '..', '..', 'health-monitor-api', '.env');
loadEnv(nextEnv);
loadEnv(apiEnv);

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MEDICAL_QUESTION = `What are the typical symptoms of hypertension (high blood pressure), and when should someone see a doctor? Reply in 2-3 short paragraphs.`;

console.log('=== Groq API thorough test (medical question) ===\n');

if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('your_') || !GROQ_API_KEY.startsWith('gsk_')) {
  console.error('FAIL: GROQ_API_KEY missing or invalid.');
  process.exit(1);
}

console.log('Key:', GROQ_API_KEY.slice(0, 12) + '...');
console.log('Model: llama-3.3-70b-versatile');
console.log('Question:', MEDICAL_QUESTION);
console.log('\n--- Request ---\n');

async function run() {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a helpful medical information assistant. Give clear, accurate, and concise answers. Always recommend consulting a doctor for personal medical decisions.' },
          { role: 'user', content: MEDICAL_QUESTION },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Response (non-JSON):', text.slice(0, 500));
      console.error('\nFAIL: Groq API returned non-JSON. Status:', res.status);
      process.exit(1);
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || text;
      console.error('FAIL: Groq API error. Status:', res.status);
      console.error('Message:', errMsg);
      process.exit(1);
    }

    const choice = data?.choices?.[0];
    const content = choice?.message?.content;
    const finishReason = choice?.finish_reason;
    const usage = data?.usage;

    if (content === undefined || content === null) {
      console.error('FAIL: No content in response.', JSON.stringify(data).slice(0, 300));
      process.exit(1);
    }

    console.log('--- Response ---\n');
    console.log(content.trim());
    console.log('\n--- Metadata ---');
    console.log('Finish reason:', finishReason);
    if (usage) {
      console.log('Prompt tokens:', usage.prompt_tokens);
      console.log('Completion tokens:', usage.completion_tokens);
      console.log('Total tokens:', usage.total_tokens);
    }
    console.log('');

    const trimmed = content.trim();
    const hasSubstance = trimmed.length >= 100;
    const hasMedicalTerms = /blood pressure|hypertension|symptom|doctor|medical|health/i.test(trimmed);

    if (hasSubstance && hasMedicalTerms) {
      console.log('SUCCESS: Groq API is running correctly. Medical question answered with relevant content.');
    } else if (hasSubstance) {
      console.log('SUCCESS: Groq API responded. (Medical relevance check was loose; response length OK.)');
    } else {
      console.log('WARN: Response may be truncated or off-topic. Length:', trimmed.length);
    }
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err.message);
    if (err.cause) console.error('Cause:', err.cause.message);
    process.exit(1);
  }
}

run();
