/**
 * Test script: verify Groq API key and chat completions.
 * Run: node scripts/test-groq.cjs
 * Reads GROQ_API_KEY from .env.local (or .env in health-monitor-api).
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

// Try frontend .env.local first, then API .env
const nextEnv = path.join(__dirname, '..', '.env.local');
const apiEnv = path.join(__dirname, '..', '..', 'health-monitor-api', '.env');
loadEnv(nextEnv);
loadEnv(apiEnv);

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.log('=== Groq API test ===\n');

if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('your_') || !GROQ_API_KEY.startsWith('gsk_')) {
  console.error('FAIL: GROQ_API_KEY missing or invalid (should start with gsk_).');
  console.error('Set GROQ_API_KEY in health-monitor-next/.env.local (get key from https://console.groq.com)');
  process.exit(1);
}

console.log('Key:', GROQ_API_KEY.slice(0, 12) + '...');
console.log('');

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
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10,
      }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Response (non-JSON):', text.slice(0, 200));
      console.error('\nFAIL: Groq API returned non-JSON. Status:', res.status);
      process.exit(1);
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || text;
      console.error('FAIL: Groq API error. Status:', res.status);
      console.error('Message:', errMsg);
      process.exit(1);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (content !== undefined) {
      console.log('Groq API: OK');
      console.log('Model reply:', (content || '').trim().slice(0, 80));
      console.log('\nSUCCESS: Groq API is working.');
    } else {
      console.error('FAIL: Unexpected response shape:', JSON.stringify(data).slice(0, 200));
      process.exit(1);
    }
  } catch (err) {
    console.error('FAIL:', err.message);
    if (err.cause) console.error('Cause:', err.cause.message);
    process.exit(1);
  }
}

run();
