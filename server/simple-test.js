// simple-test.js
// Copy this file to your project root and run: node simple-test.js

const http = require('http');
const https = require('https');

// Simple HTTP client function
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test configuration
const BASE_URL = 'localhost';
const PORT = 5001;
const API_PATH = '/api';

// Color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test cases
const tests = [
  {
    name: 'Health Check - Server',
    method: 'GET',
    path: '/health',
    expectedStatus: 200
  },
  {
    name: 'Get All Projects',
    method: 'GET', 
    path: '/projects',
    expectedStatus: 200
  },
  {
    name: 'Create User',
    method: 'POST',
    path: '/auth/create-user',
    data: {
      cognitoId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      phoneNumber: '01712345678',
      role: 'creator'
    },
    expectedStatus: 201
  },
  {
    name: 'Get Trending Projects',
    method: 'GET',
    path: '/projects/trending',
    expectedStatus: 200
  },
  {
    name: 'Get Payment Methods',
    method: 'GET',
    path: '/payments/methods',
    expectedStatus: 200
  },
  {
    name: 'Get Recent Donations',
    method: 'GET',
    path: '/donations/recent',
    expectedStatus: 200
  },
  {
    name: 'File Upload Validation',
    method: 'POST',
    path: '/upload/validate',
    data: {
      fileName: 'test.jpg',
      fileSize: 1024000,
      fileType: 'image/jpeg'
    },
    expectedStatus: 200
  }
];

// Advanced tests (require created data)
let createdUserId = null;
let createdProjectId = null;

const advancedTests = [
  {
    name: 'Create Project',
    method: 'POST',
    path: '/projects',
    getData: () => ({
      title: `Test Project ${Date.now()}`,
      description: 'This is a comprehensive test project for the crowdfunding platform. It includes all necessary fields and features to validate the complete project creation workflow and ensure everything works properly.',
      shortDescription: 'A test project for platform validation',
      category: 'technology',
      targetAmount: 50000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: {
        district: 'Dhaka',
        division: 'Dhaka'
      },
      story: 'This is our project story. We are building something amazing that will revolutionize technology. Our team has years of experience and we are committed to delivering the best possible product to our supporters.',
      risks: 'The main risks include technical challenges, supply chain issues, and market adoption. We have comprehensive mitigation strategies for all identified risks and backup plans in place.',
      rewardTiers: [
        {
          title: 'Early Bird',
          description: 'Get the product at early bird pricing',
          minimumAmount: 1000,
          maxBackers: 100,
          estimatedDelivery: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          items: ['Product', 'Thank you note']
        }
      ],
      tags: ['technology', 'innovation', 'test']
    }),
    expectedStatus: 201,
    headers: {
      'Authorization': 'Bearer mock-token' // This will likely fail, but shows the flow
    }
  },
  {
    name: 'Initiate Payment',
    method: 'POST',
    path: '/payments/initiate',
    getData: () => ({
      projectId: createdProjectId || '507f1f77bcf86cd799439011', // Mock ObjectId
      amount: 1500,
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '01812345678',
      customerAddress: 'Dhaka, Bangladesh',
      isAnonymous: false,
      message: 'Test donation'
    }),
    expectedStatus: [200, 400] // 400 is okay if project doesn't exist
  }
];

// Run basic tests
async function runBasicTests() {
  log('\n🚀 Starting Basic API Tests\n', 'blue');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const options = {
        hostname: BASE_URL,
        port: PORT,
        path: `${API_PATH}${test.path}`,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      };

      log(`Testing: ${test.name}`, 'blue');
      
      const result = await makeRequest(options, test.data);
      
      const statusOk = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus.includes(result.status)
        : result.status === test.expectedStatus;

      if (statusOk) {
        log(`✅ ${test.name} - Status: ${result.status}`, 'green');
        passed++;
        
        // Store created data for advanced tests
        if (test.name === 'Create User' && result.data.success) {
          createdUserId = result.data.data._id;
          log(`   User ID: ${createdUserId}`, 'yellow');
        }
      } else {
        log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`, 'red');
        if (result.data.message) {
          log(`   Error: ${result.data.message}`, 'red');
        }
        failed++;
      }
    } catch (error) {
      log(`❌ ${test.name} - Network Error: ${error.message}`, 'red');
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { passed, failed };
}

// Run advanced tests that depend on created data
async function runAdvancedTests() {
  log('\n🔧 Starting Advanced API Tests\n', 'blue');
  
  let passed = 0;
  let failed = 0;

  for (const test of advancedTests) {
    try {
      const options = {
        hostname: BASE_URL,
        port: PORT,
        path: `${API_PATH}${test.path}`,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      };

      const data = test.getData ? test.getData() : test.data;
      log(`Testing: ${test.name}`, 'blue');
      
      const result = await makeRequest(options, data);
      
      const statusOk = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus.includes(result.status)
        : result.status === test.expectedStatus;

      if (statusOk) {
        log(`✅ ${test.name} - Status: ${result.status}`, 'green');
        passed++;
        
        // Store project ID if created
        if (test.name === 'Create Project' && result.data.success) {
          createdProjectId = result.data.data._id;
          log(`   Project ID: ${createdProjectId}`, 'yellow');
        }
      } else {
        log(`⚠️  ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`, 'yellow');
        if (result.data.message) {
          log(`   Message: ${result.data.message}`, 'yellow');
        }
        // Don't count auth failures as hard failures
        if (result.status === 401 || result.status === 403) {
          log(`   (Auth failure expected with mock tokens)`, 'yellow');
        } else {
          failed++;
        }
      }
    } catch (error) {
      log(`❌ ${test.name} - Network Error: ${error.message}`, 'red');
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { passed, failed };
}

// Error handling tests
async function runErrorTests() {
  log('\n🚨 Testing Error Handling\n', 'blue');
  
  const errorTests = [
    {
      name: 'Invalid Project ID',
      path: '/projects/invalid-id',
      method: 'GET',
      expectedStatus: 400
    },
    {
      name: 'Missing Required Fields',
      path: '/projects',
      method: 'POST',
      data: { title: 'Incomplete' },
      expectedStatus: 400
    },
    {
      name: 'Invalid Amount',
      path: '/payments/initiate',
      method: 'POST',
      data: {
        projectId: '507f1f77bcf86cd799439011',
        amount: 5, // Below minimum
        customerName: 'Test',
        customerEmail: 'test@example.com'
      },
      expectedStatus: 400
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of errorTests) {
    try {
      const options = {
        hostname: BASE_URL,
        port: PORT,
        path: `${API_PATH}${test.path}`,
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      log(`Testing: ${test.name}`, 'blue');
      const result = await makeRequest(options, test.data);
      
      if (result.status === test.expectedStatus) {
        log(`✅ ${test.name} - Correctly returned ${result.status}`, 'green');
        passed++;
      } else {
        log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`❌ ${test.name} - Network Error: ${error.message}`, 'red');
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { passed, failed };
}

// Main test runner
async function runAllTests() {
  log('🎯 PujiGori Backend API Test Suite', 'blue');
  log('=====================================\n', 'blue');
  
  // Check if server is running
  try {
    const healthCheck = await makeRequest({
      hostname: BASE_URL,
      port: PORT,
      path: `/health`,
      method: 'GET'
    });
    
    if (healthCheck.status !== 200) {
      log('❌ Server is not responding properly. Make sure your backend is running on port 5001', 'red');
      process.exit(1);
    }
    
    log('✅ Server is running and responding', 'green');
  } catch (error) {
    log('❌ Cannot connect to server. Make sure your backend is running on http://localhost:5001', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }

  // Run test suites
  const basicResults = await runBasicTests();
  const advancedResults = await runAdvancedTests();
  const errorResults = await runErrorTests();

  // Summary
  const total = basicResults.passed + basicResults.failed + 
                advancedResults.passed + advancedResults.failed + 
                errorResults.passed + errorResults.failed;
  const totalPassed = basicResults.passed + advancedResults.passed + errorResults.passed;
  const totalFailed = basicResults.failed + advancedResults.failed + errorResults.failed;

  log('\n📊 TEST SUMMARY', 'blue');
  log('================', 'blue');
  log(`✅ Passed: ${totalPassed}/${total}`, 'green');
  log(`❌ Failed: ${totalFailed}/${total}`, totalFailed > 0 ? 'red' : 'green');
  
  const successRate = Math.round((totalPassed / total) * 100);
  log(`📈 Success Rate: ${successRate}%`, successRate >= 70 ? 'green' : 'yellow');

  if (successRate >= 70) {
    log('\n🎉 Your backend is working well! Ready for frontend development.', 'green');
  } else {
    log('\n⚠️  Some issues found. Check the failed tests above.', 'yellow');
  }

  log('\n💡 Next Steps:', 'blue');
  log('1. Fix any failed tests (auth failures are expected)', 'reset');
  log('2. Set up real authentication tokens for protected routes', 'reset');
  log('3. Configure AWS S3 and SSLCommerz for full functionality', 'reset');
  log('4. Start building your frontend!', 'reset');
}

// Instructions
if (process.argv.length === 2) {
  log('\n📋 How to use this test script:', 'blue');
  log('1. Make sure your backend server is running: npm start', 'reset');
  log('2. Run this script: node simple-test.js', 'reset');
  log('3. Check the results and fix any issues', 'reset');
  log('\nStarting tests in 3 seconds...\n', 'yellow');
  
  setTimeout(() => {
    runAllTests().catch(console.error);
  }, 3000);
} else {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runBasicTests, runAdvancedTests, runErrorTests };