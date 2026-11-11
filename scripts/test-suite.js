// Automated Regression & Integration Test Suite for HomeBrain
import http from 'http';

console.log('🚀 Running HomeBrain Automated Regression & Quality Assurance Test Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

// 1. Test Server Health API
async function testHealthEndpoint() {
  console.log('--- Test 1: Server Health Check ---');
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          assert(res.statusCode === 200, 'Health endpoint responds with 200 OK');
          assert(json.status === 'ok', 'Status is "ok"');
          assert(json.app.includes('HomeBrain'), 'App name is HomeBrain');
          assert(typeof json.llmConfigured === 'boolean', 'LLM configuration flag present');
          resolve(true);
        } catch (e) {
          assert(false, `Health check JSON parsing failed: ${e.message}`);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      assert(false, `Server health check failed (server offline): ${e.message}`);
      resolve(false);
    });
  });
}

// 2. Test Security: Auth Middleware Rejects Unauthenticated Requests
async function testAuthRejection() {
  console.log('\n--- Test 2: Security & Authorization Protection ---');
  return new Promise((resolve) => {
    const postData = JSON.stringify({ query: 'What is happening today?' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      assert(res.statusCode === 401, 'Protected /api/ai/query rejects unauthenticated requests with 401');
      resolve(true);
    });
    req.on('error', () => {
      assert(false, 'Request to /api/ai/query failed');
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

// 3. Test Security: /api/documents/extract Protected
async function testDocumentExtractionProtection() {
  console.log('\n--- Test 3: Document Vault Extract API Security ---');
  return new Promise((resolve) => {
    const postData = JSON.stringify({ fileBase64: 'test', mimeType: 'text/plain' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/documents/extract',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      assert(res.statusCode === 401, 'Protected /api/documents/extract rejects unauthenticated requests with 401');
      resolve(true);
    });
    req.on('error', () => {
      assert(false, 'Request to /api/documents/extract failed');
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

// 4. Test Security: /api/timeline/search Protected
async function testTimelineSearchProtection() {
  console.log('\n--- Test 4: Family Timeline Search API Security ---');
  return new Promise((resolve) => {
    const postData = JSON.stringify({ query: 'vacation' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/timeline/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      assert(res.statusCode === 401, 'Protected /api/timeline/search rejects unauthenticated requests with 401');
      resolve(true);
    });
    req.on('error', () => {
      assert(false, 'Request to /api/timeline/search failed');
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

async function runAll() {
  await testHealthEndpoint();
  await testAuthRejection();
  await testDocumentExtractionProtection();
  await testTimelineSearchProtection();

  console.log(`\n==========================================`);
  console.log(`Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log(`==========================================\n`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

runAll();

