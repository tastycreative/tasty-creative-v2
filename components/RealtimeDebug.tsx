'use client';

import { useEffect, useState } from 'react';

interface RealtimeDebugProps {
  teamId: string;
}

export function RealtimeDebug({ teamId }: RealtimeDebugProps) {
  const [connectionStatus, setConnectionStatus] = useState({
    websocket: 'untested',
    sse: 'untested',
    http: 'untested'
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    testConnections();
  }, [teamId]);

  const testConnections = async () => {
    addLog('Starting connection tests...');

    // Test WebSocket
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/websocket`;
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          setConnectionStatus(prev => ({ ...prev, websocket: 'timeout' }));
          addLog('WebSocket: Timeout');
          reject(new Error('timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }));
          addLog('WebSocket: Connected');
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          setConnectionStatus(prev => ({ ...prev, websocket: 'failed' }));
          addLog('WebSocket: Failed');
          reject(new Error('failed'));
        };
      });
    } catch (error) {
      addLog(`WebSocket error: ${error}`);
    }

    // Test SSE
    try {
      const eventSource = new EventSource(`/api/realtime?teamId=${teamId}`);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          setConnectionStatus(prev => ({ ...prev, sse: 'timeout' }));
          addLog('SSE: Timeout');
          eventSource.close();
          reject(new Error('timeout'));
        }, 5000);

        eventSource.onopen = () => {
          clearTimeout(timeout);
          setConnectionStatus(prev => ({ ...prev, sse: 'connected' }));
          addLog('SSE: Connected');
          eventSource.close();
          resolve(true);
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          setConnectionStatus(prev => ({ ...prev, sse: 'failed' }));
          addLog('SSE: Failed');
          eventSource.close();
          reject(new Error('failed'));
        };
      });
    } catch (error) {
      addLog(`SSE error: ${error}`);
    }

    // Test HTTP API
    try {
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TASK_UPDATED',
          taskId: 'debug-test',
          teamId: teamId,
          data: { title: 'Debug Test' }
        })
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, http: 'success' }));
        addLog('HTTP API: Success');
      } else {
        setConnectionStatus(prev => ({ ...prev, http: 'failed' }));
        addLog(`HTTP API: Failed (${response.status})`);
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, http: 'failed' }));
      addLog(`HTTP API error: ${error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'timeout':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Real-time Debug
        </h3>
        <button
          onClick={testConnections}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Retest
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span>WebSocket:</span>
          <span className={getStatusColor(connectionStatus.websocket)}>
            {connectionStatus.websocket}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span>SSE:</span>
          <span className={getStatusColor(connectionStatus.sse)}>
            {connectionStatus.sse}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span>HTTP API:</span>
          <span className={getStatusColor(connectionStatus.http)}>
            {connectionStatus.http}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-20 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Team: {teamId}
      </div>
    </div>
  );
}
