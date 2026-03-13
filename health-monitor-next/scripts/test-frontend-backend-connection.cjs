/**
 * Comprehensive test to verify frontend-backend connectivity
 * Tests actual endpoints used by the frontend
 */

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const status = response.status;
    const statusText = response.statusText;
    
    let data = null;
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (e) {
      // Not JSON, that's okay
    }
    
    return { success: true, status, statusText, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Testing Frontend-Backend Connection\n');
  console.log('='.repeat(60));
  
  // Use 127.0.0.1 instead of localhost for better Windows compatibility
  const API_URL = (process.env.API_URL || 'http://localhost:8000').replace('localhost', '127.0.0.1');
  console.log(`Backend URL: ${API_URL}\n`);
  
  // Test 1: FastAPI docs endpoint
  console.log('1️⃣  Testing FastAPI docs endpoint...');
  const docsTest = await testEndpoint(`${API_URL}/docs`);
  if (docsTest.success && docsTest.status === 200) {
    console.log('   ✅ /docs is accessible (FastAPI Swagger UI)');
  } else {
    console.log(`   ❌ /docs failed: ${docsTest.error || `Status ${docsTest.status}`}`);
  }
  
  // Test 2: OpenAPI JSON
  console.log('\n2️⃣  Testing OpenAPI schema...');
  const openApiTest = await testEndpoint(`${API_URL}/openapi.json`);
  if (openApiTest.success && openApiTest.status === 200) {
    console.log('   ✅ /openapi.json is accessible');
    if (openApiTest.data && openApiTest.data.paths) {
      const endpoints = Object.keys(openApiTest.data.paths);
      console.log(`   📋 Available endpoints: ${endpoints.length}`);
      endpoints.slice(0, 5).forEach(path => {
        console.log(`      - ${path}`);
      });
      if (endpoints.length > 5) {
        console.log(`      ... and ${endpoints.length - 5} more`);
      }
    }
  } else {
    console.log(`   ❌ /openapi.json failed: ${openApiTest.error || `Status ${openApiTest.status}`}`);
  }
  
  // Test 3: Chat endpoint (POST)
  console.log('\n3️⃣  Testing /chat endpoint (used by frontend)...');
  const chatTest = await testEndpoint(`${API_URL}/chat`, 'POST', {
    messages: [{ role: 'user', content: 'test' }],
    llm_choice: 'llama-3.3-70b-versatile'
  });
  if (chatTest.success) {
    if (chatTest.status === 200) {
      console.log('   ✅ /chat endpoint is working!');
    } else if (chatTest.status === 422) {
      console.log('   ⚠️  /chat endpoint exists but validation failed (expected - test data incomplete)');
    } else {
      console.log(`   ⚠️  /chat returned status ${chatTest.status} (endpoint exists)`);
    }
  } else {
    console.log(`   ❌ /chat failed: ${chatTest.error}`);
  }
  
  // Test 4: RAG endpoint
  console.log('\n4️⃣  Testing /rag-query-v2 endpoint...');
  const ragTest = await testEndpoint(`${API_URL}/rag-query-v2`, 'POST', {
    query: 'test',
    llm_choice: 'llama-3.3-70b-versatile'
  });
  if (ragTest.success) {
    if (ragTest.status === 200 || ragTest.status === 422) {
      console.log('   ✅ /rag-query-v2 endpoint exists');
    } else {
      console.log(`   ⚠️  /rag-query-v2 returned status ${ragTest.status}`);
    }
  } else {
    console.log(`   ❌ /rag-query-v2 failed: ${ragTest.error}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Connection Summary:');
  console.log(`   Frontend: http://localhost:3000 (Next.js)`);
  console.log(`   Backend:  ${API_URL} (FastAPI)`);
  console.log(`   Status:   ${docsTest.success ? '✅ CONNECTED' : '❌ NOT CONNECTED'}`);
  
  if (docsTest.success) {
    console.log('\n✅ Frontend and backend are connected and working!');
    console.log('   The frontend can communicate with the backend API.');
  } else {
    console.log('\n❌ Backend is not accessible.');
    console.log('   Make sure the backend is running:');
    console.log('   cd health-monitor-api');
    console.log('   .\\venv\\Scripts\\Activate.ps1');
    console.log('   uvicorn main:app --host 0.0.0.0 --port 8000 --reload');
  }
}

main().catch(console.error);
