#!/usr/bin/env node

/**
 * Test script for n8n webhook integration
 * Tests the /api/webhook/mark-as-final endpoint
 *
 * Usage: node test-n8n-webhook.js
 */

const testPayload = {
  videoTitle: "TEST_ALAYA_SOLO_DILDO_11/06/2025",
  videoCategory: "Solo",
  featuredEvents: "Dildo, Toys, Squirting",
  status: "UNUSED",
  caption: "Test caption for webhook integration",
  linkDrop: "",
  priceSet: "$15",
  additionalNotes: "This is a test from the test script",
  videoLink: "https://drive.google.com/file/d/1jXufbOr9hUEZHdGNRnDDgM5rjheSmqWL",
  creationDate: "November 6, 2025",
  creatorAt: "Alaya",
  videoLength: "4 mins 49 secs",
  results: ""
};

async function testWebhook() {
  console.log('🧪 Testing n8n Webhook Integration\n');
  console.log('📍 Endpoint: http://localhost:3000/api/webhook/mark-as-final');
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Sending request...\n');

  try {
    const response = await fetch('http://localhost:3000/api/webhook/mark-as-final', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail auth check, but will test the n8n connection
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('📄 Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('📄 Response (text):', text);
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS: Webhook call succeeded!');
      if (data?.n8nResponse) {
        console.log('✅ n8n Response:', JSON.stringify(data.n8nResponse, null, 2));
      }
    } else {
      console.log('\n❌ ERROR: Webhook call failed');
      if (data?.error) {
        console.log('❌ Error:', data.error);
        if (data?.details) {
          console.log('❌ Details:', data.details);
        }
      }
    }

  } catch (error) {
    console.log('\n❌ NETWORK ERROR:');
    console.error(error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Next.js dev server is running (npm run dev)');
    console.log('   2. Server is accessible at http://localhost:3000');
  }
}

// Test direct n8n webhook (without auth)
async function testDirectN8n() {
  console.log('\n\n🧪 Testing Direct n8n Webhook\n');
  const n8nUrl = 'https://n8n.tastycreative.xyz/webhook/gallery-data';
  console.log(`📍 Endpoint: ${n8nUrl}`);
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Sending request...\n');

  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('📄 Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('📄 Response (text):', text);
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS: Direct n8n webhook succeeded!');
    } else {
      console.log('\n❌ ERROR: Direct n8n webhook failed');

      if (response.status === 404) {
        console.log('\n💡 Troubleshooting 404 Error:');
        console.log('   1. Open n8n workflow in browser');
        console.log('   2. Click "Activate" toggle (top right)');
        console.log('   3. Verify webhook URL matches exactly');
        console.log('   4. In test mode, click "Execute Workflow" before each test');
        console.log('\n   Current URL: https://n8n.tastycreative.xyz/webhook/gallery-data');
      }
    }

  } catch (error) {
    console.log('\n❌ NETWORK ERROR:');
    console.error(error.message);
    console.log('\n💡 Check:');
    console.log('   1. n8n server is running and accessible');
    console.log('   2. Webhook URL is correct');
    console.log('   3. Network/firewall allows connection');
  }
}

// Run tests
console.log('═'.repeat(70));
console.log('  N8N WEBHOOK INTEGRATION TEST');
console.log('═'.repeat(70));

// Test 1: Direct n8n webhook (to verify n8n is working)
testDirectN8n()
  .then(() => {
    // Test 2: API endpoint (requires auth, will likely fail but shows connection)
    return testWebhook();
  })
  .then(() => {
    console.log('\n' + '═'.repeat(70));
    console.log('  TEST COMPLETE');
    console.log('═'.repeat(70));
  });
