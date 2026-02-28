'use client';

import { useState } from 'react';

export default function APITestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, url: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      return {
        status: response.status,
        ok: response.ok,
        data: data
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
    // Check both userId and userid for compatibility
    const userId = localStorage.getItem('userId') || localStorage.getItem('userid');
    
    const tests = {
      'Backend Health': `http://localhost:5000/health`,
      'Posts Endpoint': `${apiBase}/posts?limit=5`,
      'Social Feed': `${apiBase}/social/feed?limit=5`,
      'Notifications': `${apiBase}/social/notifications/unread`,
      'Auth Profile': `${apiBase}/auth/profile/${userId}`
    };

    const testResults: any = {};
    
    for (const [name, url] of Object.entries(tests)) {
      console.log(`Testing ${name}...`);
      testResults[name] = await testEndpoint(name, url);
    }
    
    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Connectivity Test</h1>
        
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mb-8"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>

        <div className="space-y-4">
          {Object.entries(results).map(([name, result]: [string, any]) => (
            <div key={name} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
            <li>Make sure the backend server is running on port 5000</li>
            <li>Check that DATABASE_URL is configured in backend/.env</li>
            <li>Run database migrations: <code className="bg-yellow-100 px-2 py-1 rounded">npx prisma migrate dev</code></li>
            <li>Seed the database if empty: <code className="bg-yellow-100 px-2 py-1 rounded">npx prisma db seed</code></li>
            <li>Verify you're logged in (check localStorage for accessToken)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
