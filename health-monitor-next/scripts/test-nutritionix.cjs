/**
 * Test script to verify Nutritionix API key and connection
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

// Parse NUTRITIONIX_APP_ID and NUTRITIONIX_API_KEY from env file
const appIdMatch = envContent.match(/^NUTRITIONIX_APP_ID=(.+)$/m);
const apiKeyMatch = envContent.match(/^NUTRITIONIX_API_KEY=(.+)$/m);

const NUTRITIONIX_APP_ID = appIdMatch ? appIdMatch[1].trim() : null;
const NUTRITIONIX_API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function testNutritionix() {
  console.log('🔍 Testing Nutritionix API Configuration\n');
  console.log('='.repeat(60));
  
  if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_API_KEY) {
    console.log('❌ NUTRITIONIX_APP_ID or NUTRITIONIX_API_KEY is not set in .env.local');
    console.log('\n💡 To fix:');
    console.log('   1. Get your API credentials from https://www.nutritionix.com/business/api');
    console.log('   2. Add to .env.local:');
    console.log('      NUTRITIONIX_APP_ID=your_app_id');
    console.log('      NUTRITIONIX_API_KEY=your_api_key');
    console.log('   3. Restart the dev server');
    process.exit(1);
  }
  
  if (NUTRITIONIX_APP_ID.startsWith('your_') || NUTRITIONIX_API_KEY.startsWith('your_')) {
    console.log('⚠️  API credentials appear to be placeholders');
    console.log(`   APP_ID: ${NUTRITIONIX_APP_ID.substring(0, 10)}...`);
    console.log(`   API_KEY: ${NUTRITIONIX_API_KEY.substring(0, 10)}...`);
    console.log('\n💡 Replace them with your actual credentials from https://www.nutritionix.com/business/api');
    process.exit(1);
  }
  
  console.log(`✅ NUTRITIONIX_APP_ID is set (length: ${NUTRITIONIX_APP_ID.length})`);
  console.log(`✅ NUTRITIONIX_API_KEY is set (length: ${NUTRITIONIX_API_KEY.length})\n`);
  
  // Test 1: Instant Search API
  console.log('🧪 Test 1: Instant Search API (for autocomplete)...\n');
  try {
    const instantUrl = new URL('https://trackapi.nutritionix.com/v2/search/instant');
    instantUrl.searchParams.append('query', 'banana');
    
    const instantResponse = await fetch(instantUrl.toString(), {
      method: 'GET',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${instantResponse.status} ${instantResponse.statusText}`);
    
    if (!instantResponse.ok) {
      const errorText = await instantResponse.text();
      console.log(`   ❌ Instant Search failed`);
      console.log(`   Response: ${errorText.substring(0, 300)}`);
      
      if (instantResponse.status === 401 || instantResponse.status === 403) {
        console.log('\n💡 Your API credentials may be invalid or expired.');
        console.log('   Get new credentials from https://www.nutritionix.com/business/api');
      }
      process.exit(1);
    }
    
    const instantData = await instantResponse.json();
    console.log(`   ✅ Instant Search API is working!`);
    console.log(`   Results:`);
    if (instantData.common && instantData.common.length > 0) {
      console.log(`     - Common foods: ${instantData.common.length} results`);
      console.log(`     - First result: "${instantData.common[0].food_name}"`);
    } else {
      console.log(`     - No common foods found (this might be normal for some queries)`);
    }
    if (instantData.branded && instantData.branded.length > 0) {
      console.log(`     - Branded foods: ${instantData.branded.length} results`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error calling Instant Search API: ${error.message}`);
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Check your internet connection');
    }
    process.exit(1);
  }
  
  // Test 2: Natural Nutrients API
  console.log('🧪 Test 2: Natural Nutrients API (for food details)...\n');
  try {
    const nutrientsResponse = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '1 banana' }),
    });
    
    console.log(`   Status: ${nutrientsResponse.status} ${nutrientsResponse.statusText}`);
    
    if (!nutrientsResponse.ok) {
      const errorText = await nutrientsResponse.text();
      console.log(`   ❌ Natural Nutrients API failed`);
      console.log(`   Response: ${errorText.substring(0, 300)}`);
      
      if (nutrientsResponse.status === 401 || nutrientsResponse.status === 403) {
        console.log('\n💡 Your API credentials may be invalid or expired.');
        console.log('   Get new credentials from https://www.nutritionix.com/business/api');
      }
      process.exit(1);
    }
    
    const nutrientsData = await nutrientsResponse.json();
    console.log(`   ✅ Natural Nutrients API is working!`);
    if (nutrientsData.foods && nutrientsData.foods.length > 0) {
      const food = nutrientsData.foods[0];
      console.log(`   Results:`);
      console.log(`     - Food: "${food.food_name}"`);
      console.log(`     - Calories: ${food.nf_calories || 'N/A'}`);
      console.log(`     - Protein: ${food.nf_protein || 'N/A'}g`);
      console.log(`     - Carbs: ${food.nf_total_carbohydrate || 'N/A'}g`);
      console.log(`     - Fat: ${food.nf_total_fat || 'N/A'}g`);
    } else {
      console.log(`     - No food details found`);
    }
    console.log('');
  } catch (error) {
    console.log(`   ❌ Error calling Natural Nutrients API: ${error.message}`);
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Check your internet connection');
    }
    process.exit(1);
  }
  
  console.log('='.repeat(60));
  console.log('✅ All Nutritionix API tests passed!');
  console.log('\n💡 Your Nutritionix integration is configured correctly and ready to use.');
}

testNutritionix().catch(console.error);
