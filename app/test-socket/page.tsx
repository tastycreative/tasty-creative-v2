'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function TestSocketPage() {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const testSocket = async () => {
      try {
        addLog('Testing Socket.IO server initialization...');
        setStatus('Testing server...');

        // Test server endpoint
        const response = await fetch('/api/socket');
        addLog(`Server init response: ${response.status}`);

        if (response.ok) {
          addLog('Server initialized, testing client connection...');
          setStatus('Testing client connection...');

          // Test client connection
          const socket = io({
            path: '/api/socket.io/',
            addTrailingSlash: false,
            timeout: 5000
          });

          socket.on('connect', async () => {
            addLog('✅ Socket.IO client connected successfully!');
            addLog(`🔌 Socket ID: ${socket.id}`);
            setStatus('Testing rooms...');

            // First test a simple ping
            addLog('📡 Testing server event handling...');
            socket.emit('ping', 'test-ping');
            
            socket.on('pong', (data) => {
              addLog(`✅ Server responded to ping: ${data}`);
            });

            // Test joining notification room
            try {
              const sessionResponse = await fetch('/api/auth/session');
              if (sessionResponse.ok) {
                const session = await sessionResponse.json();
                if (session?.user?.id) {
                  addLog(`📱 Found user ID: ${session.user.id}, joining notification room...`);
                  socket.emit('join-notifications', session.user.id);
                } else {
                  addLog('⚠️ No user session found');
                }
              }
            } catch (error) {
              addLog(`❌ Session fetch error: ${error}`);
            }

            // Listen for join confirmations and test notifications
            socket.on('joined-notifications', (userId) => {
              addLog(`✅ Successfully joined notifications room for user: ${userId}`);
              setStatus('Connected & Room Joined');
              
              // Test receiving notifications
              socket.on('new-notification', (notification) => {
                addLog(`🎉 Received test notification: ${notification.title}`);
              });
              
              // Cleanup after 5 seconds
              setTimeout(() => {
                socket.disconnect();
                addLog('🔌 Disconnected after test completion');
              }, 5000);
            });

            // If no room join confirmation after 3 seconds
            setTimeout(() => {
              if (status === 'Testing rooms...') {
                addLog('⚠️ No room join confirmation received');
                setStatus('Connected but no room join');
                socket.disconnect();
              }
            }, 3000);
          });

          socket.on('connect_error', (error) => {
            addLog(`❌ Socket.IO connection error: ${error.message}`);
            setStatus('Connection failed');
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (socket.connected === false) {
              addLog('⏰ Connection timeout');
              setStatus('Timeout');
              socket.disconnect();
            }
          }, 10000);

        } else {
          addLog('❌ Server initialization failed');
          setStatus('Server init failed');
        }

      } catch (error) {
        addLog(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setStatus('Error');
      }
    };

    testSocket();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Connection Test</h1>
      
      <div className="mb-4">
        <strong>Status: </strong>
        <span className={`px-2 py-1 rounded ${
          status === 'Connected' ? 'bg-green-100 text-green-800' :
          status.includes('failed') || status === 'Error' || status === 'Timeout' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status}
        </span>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Logs:</h3>
        <div className="space-y-1 font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index} className="text-gray-700">
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>This page tests if Socket.IO server initialization and client connection are working.</p>
        <p>Visit this page in your browser and check the logs to diagnose Socket.IO issues.</p>
      </div>
    </div>
  );
}