// Test script to validate WebSocket functionality on Vercel
// Run this in your browser console on production

async function testRealtimeConnection() {
  console.log('🧪 Testing real-time connection on production...');
  
  try {
    // Test 1: Check if WebSocket API endpoint exists
    console.log('📡 Testing WebSocket endpoint...');
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/websocket`;
    
    const ws = new WebSocket(wsUrl);
    
    const wsTest = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        
        // Test subscription
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          teamId: 'test-team'
        }));
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'SUBSCRIBED') {
            console.log('✅ WebSocket subscription successful');
            resolve(true);
          }
        };
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.log('❌ WebSocket connection failed:', error);
        reject(error);
      };
    });
    
    try {
      await wsTest;
      ws.close();
    } catch (error) {
      console.log('⚠️ WebSocket failed, testing SSE fallback...');
      
      // Test 2: Server-Sent Events fallback
      const eventSource = new EventSource(`/api/realtime?teamId=test-team`);
      
      const sseTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SSE connection timeout'));
        }, 10000);
        
        eventSource.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ SSE connection successful');
          resolve(true);
        };
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'CONNECTED') {
            console.log('✅ SSE subscription successful');
          }
        };
        
        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          console.log('❌ SSE connection failed:', error);
          reject(error);
        };
      });
      
      try {
        await sseTest;
        eventSource.close();
      } catch (sseError) {
        console.log('⚠️ SSE also failed, falling back to polling');
        
        // Test 3: HTTP polling fallback
        try {
          const response = await fetch('/api/realtime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'TASK_UPDATED',
              taskId: 'test-task',
              teamId: 'test-team',
              data: { title: 'Test Task' }
            })
          });
          
          if (response.ok) {
            console.log('✅ HTTP API working - polling fallback available');
          } else {
            console.log('❌ HTTP API also failed');
          }
        } catch (httpError) {
          console.log('❌ All connection methods failed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Environment detection
function detectEnvironment() {
  console.log('🌍 Environment Detection:');
  console.log('- Protocol:', window.location.protocol);
  console.log('- Host:', window.location.host);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- WebSocket Support:', typeof WebSocket !== 'undefined');
  console.log('- EventSource Support:', typeof EventSource !== 'undefined');
}

// Run tests
detectEnvironment();
testRealtimeConnection();
