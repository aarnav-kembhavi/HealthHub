/**
 * Test script to verify OpenRouter API key and connection
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.log('❌ Could not read .env.local file');
  process.exit(1);
}

// Parse OPENROUTER_API_KEY from env file
const openrouterMatch = envContent.match(/^OPENROUTER_API_KEY=(.+)$/m);
const OPENROUTER_API_KEY = openrouterMatch ? openrouterMatch[1].trim() : null;

// Parse OPENROUTER_MODEL (optional)
const modelMatch = envContent.match(/^OPENROUTER_MODEL=(.+)$/m);
const OPENROUTER_MODEL = modelMatch ? modelMatch[1].trim() : 'openai/gpt-4o';

async function testOpenRouter() {
  console.log('🔍 Testing OpenRouter API Configuration\n');
  console.log('='.repeat(60));
  
  if (!OPENROUTER_API_KEY) {
    console.log('❌ OPENROUTER_API_KEY is not set in .env.local');
    console.log('\n💡 To fix:');
    console.log('   1. Get your API key from https://openrouter.ai/keys');
    console.log('   2. Add to .env.local: OPENROUTER_API_KEY=your_key_here');
    console.log('   3. Restart the dev server');
    process.exit(1);
  }
  
  if (OPENROUTER_API_KEY.startsWith('your_') || OPENROUTER_API_KEY.length < 10) {
    console.log('⚠️  OPENROUTER_API_KEY appears to be a placeholder');
    console.log(`   Current value: ${OPENROUTER_API_KEY.substring(0, 10)}...`);
    console.log('\n💡 Replace it with your actual API key from https://openrouter.ai/keys');
    process.exit(1);
  }
  
  console.log(`✅ OPENROUTER_API_KEY is set (length: ${OPENROUTER_API_KEY.length})`);
  console.log(`📋 Default model: ${OPENROUTER_MODEL}\n`);
  
  console.log('🧪 Testing OpenRouter API connection...\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Health Monitor',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'user', content: 'Say "Hello, OpenRouter is working!" in one sentence.' }
        ],
        temperature: 0.7,
        max_tokens: 50, // Limit tokens for testing
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API request failed (status ${response.status})`);
      console.log(`   Response: ${errorText.substring(0, 200)}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log('\n💡 Your API key may be invalid or expired.');
        console.log('   Get a new key from https://openrouter.ai/keys');
      }
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      console.log('✅ OpenRouter API is working!');
      console.log(`\n📝 Response: ${content}`);
      
      if (data.usage) {
        console.log(`\n📊 Usage:`);
        console.log(`   Prompt tokens: ${data.usage.prompt_tokens}`);
        console.log(`   Completion tokens: ${data.usage.completion_tokens}`);
        console.log(`   Total tokens: ${data.usage.total_tokens}`);
      }
      
      console.log('\n✅ OpenRouter is configured correctly and ready to use!');
    } else {
      console.log('❌ Unexpected response format');
      console.log(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Error connecting to OpenRouter: ${error.message}`);
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Check your internet connection');
    }
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
}

testOpenRouter().catch(console.error);
