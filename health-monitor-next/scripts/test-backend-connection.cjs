/**
 * Test script to check if frontend can connect to backend API
 * Tests both port 8000 and 8001 (backend main.py shows 8001, but frontend uses 8000)
 */

const http = require('http');

const API_URLS = [
  'http://localhost:8000',
  'http://localhost:8001'
];

const ENDPOINTS = [
  '/',
  '/docs',
  '/health',
  '/chat'
];

async function testConnection(baseUrl) {
  console.log(`\n🔍 Testing ${baseUrl}...`);
  
  // Test root endpoint
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok || response.status === 404) {
      console.log(`✅ ${baseUrl} is reachable (status: ${response.status})`);
      
      // Try /docs (FastAPI docs)
      try {
        const docsResponse = await fetch(`${baseUrl}/docs`);
        if (docsResponse.ok) {
          console.log(`✅ ${baseUrl}/docs is accessible (FastAPI docs)`);
        }
      } catch (e) {
        // Ignore docs errors
      }
      
      // Try a simple POST to /chat (if it exists)
      try {
        const chatResponse = await fetch(`${baseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [] })
        });
        console.log(`✅ ${baseUrl}/chat endpoint exists (status: ${chatResponse.status})`);
      } catch (e) {
        console.log(`⚠️  ${baseUrl}/chat endpoint test failed: ${e.message}`);
      }
      
      return true;
    } else {
      console.log(`⚠️  ${baseUrl} returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${baseUrl} is NOT reachable (connection refused - backend not running?)`);
    } else {
      console.log(`❌ ${baseUrl} error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Frontend-Backend Connection\n');
  console.log('=' .repeat(60));
  
  let foundBackend = false;
  
  for (const url of API_URLS) {
    const isReachable = await testConnection(url);
    if (isReachable) {
      foundBackend = true;
      console.log(`\n✅ BACKEND FOUND at ${url}`);
      console.log(`\n📝 Frontend configuration:`);
      console.log(`   NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`);
      console.log(`   API_URL: ${process.env.API_URL || 'http://localhost:8000'}`);
      
      if (url.includes(':8001') && (process.env.API_URL || '').includes(':8000')) {
        console.log(`\n⚠️  WARNING: Port mismatch detected!`);
        console.log(`   Backend is running on port 8001`);
        console.log(`   Frontend is configured for port 8000`);
        console.log(`   Update .env.local to use port 8001 or start backend on 8000`);
      }
      break;
    }
  }
  
  if (!foundBackend) {
    console.log(`\n❌ NO BACKEND FOUND on ports 8000 or 8001`);
    console.log(`\n💡 To start the backend:`);
    console.log(`   1. cd health-monitor-api`);
    console.log(`   2. Activate virtual environment: .\\venv\\Scripts\\Activate.ps1`);
    console.log(`   3. Run: uvicorn main:app --reload --port 8000`);
    console.log(`   OR: python main.py (runs on port 8001)`);
  }
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
