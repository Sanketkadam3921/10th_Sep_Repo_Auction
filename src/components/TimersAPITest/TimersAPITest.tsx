import React, { useState, useEffect } from 'react';
import auctionTimerService, { TimerData } from '../../services/auctionTimerService';
import apiAuctionService from '../../services/apiAuctionService';
import { Clock, Play, Pause, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const TimersAPITest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [timerUpdates, setTimerUpdates] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string>('');

  useEffect(() => {
    // Check if auth token exists
    const token = localStorage.getItem('authToken');
    setAuthToken(token || 'No token found');
  }, []);

  const testTimersAPI = async () => {
    setApiStatus('testing');
    setError(null);
    setApiResponse(null);

    try {
      console.log('[TimersAPITest] Testing timers API...');
      const response = await apiAuctionService.fetchAuctionTimers();
      console.log('[TimersAPITest] API Response:', response);
      
      setApiResponse(response);
      setApiStatus('success');
    } catch (err: any) {
      console.error('[TimersAPITest] API Error:', err);
      setError(err.message || 'Unknown error');
      setApiStatus('error');
    }
  };

  const startPolling = () => {
    console.log('[TimersAPITest] Starting polling...');
    setIsPolling(true);
    setTimerUpdates([]);
    
    // Subscribe to timer updates
    const unsubscribe = auctionTimerService.subscribe('*', (data: TimerData) => {
      console.log('[TimersAPITest] Timer update received:', data);
      setTimerUpdates(prev => [
        ...prev.slice(-9), // Keep last 10 updates
        {
          timestamp: new Date().toLocaleTimeString(),
          auctionId: data.auction_id,
          status: data.status,
          timeRemaining: data.time_remaining,
          data: data
        }
      ]);
    });

    // Start the polling service
    auctionTimerService.startPolling(3000); // Poll every 3 seconds for testing

    // Store unsubscribe function
    (window as any).timerUnsubscribe = unsubscribe;
  };

  const stopPolling = () => {
    console.log('[TimersAPITest] Stopping polling...');
    setIsPolling(false);
    
    auctionTimerService.stopPolling();
    
    if ((window as any).timerUnsubscribe) {
      (window as any).timerUnsubscribe();
      delete (window as any).timerUnsubscribe;
    }
  };

  const manualFetch = async () => {
    try {
      console.log('[TimersAPITest] Manual fetch...');
      await auctionTimerService.fetchAndProcess();
    } catch (err) {
      console.error('[TimersAPITest] Manual fetch failed:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={24} />
        Timers API Test
      </h2>

      {/* Auth Status */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <strong>Auth Token:</strong> {authToken ? `${authToken.substring(0, 20)}...` : 'Not found'}
      </div>

      {/* API Test Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h3>Direct API Test</h3>
        <button 
          onClick={testTimersAPI}
          disabled={apiStatus === 'testing'}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: apiStatus === 'testing' ? 'wait' : 'pointer'
          }}
        >
          {apiStatus === 'testing' ? 'Testing...' : 'Test Timers API'}
        </button>

        {apiStatus === 'success' && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <CheckCircle size={16} style={{ color: 'green', marginRight: '5px' }} />
            API call successful!
          </div>
        )}

        {apiStatus === 'error' && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
            <XCircle size={16} style={{ color: 'red', marginRight: '5px' }} />
            Error: {error}
          </div>
        )}

        {apiResponse && (
          <div style={{ marginTop: '10px' }}>
            <h4>Response:</h4>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Polling Test Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h3>Real-time Polling Test</h3>
        <div style={{ marginBottom: '10px' }}>
          {!isPolling ? (
            <button 
              onClick={startPolling}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                marginRight: '10px'
              }}
            >
              <Play size={16} style={{ marginRight: '5px' }} />
              Start Polling
            </button>
          ) : (
            <button 
              onClick={stopPolling}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                marginRight: '10px'
              }}
            >
              <Pause size={16} style={{ marginRight: '5px' }} />
              Stop Polling
            </button>
          )}

          <button 
            onClick={manualFetch}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px'
            }}
          >
            <RefreshCw size={16} style={{ marginRight: '5px' }} />
            Manual Fetch
          </button>
        </div>

        <div>
          <strong>Polling Status:</strong> {isPolling ? '🟢 Active' : '🔴 Stopped'}
        </div>

        {timerUpdates.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4>Timer Updates:</h4>
            <div style={{ maxHeight: '300px', overflow: 'auto', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
              {timerUpdates.map((update, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '5px', backgroundColor: 'white', borderRadius: '3px' }}>
                  <div><strong>{update.timestamp}</strong> - Auction {update.auctionId}</div>
                  <div>Status: {update.status} | Time Remaining: {update.timeRemaining}ms</div>
                  <details>
                    <summary>Raw Data</summary>
                    <pre style={{ fontSize: '12px' }}>{JSON.stringify(update.data, null, 2)}</pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '5px' }}>
        <h4>Instructions:</h4>
        <ol>
          <li>First, test the direct API call to see if the endpoint responds</li>
          <li>If successful, start polling to see real-time updates</li>
          <li>Check browser console for detailed logs</li>
          <li>The service will emit updates via WebSocket service for other components</li>
        </ol>
      </div>
    </div>
  );
};

export default TimersAPITest;
