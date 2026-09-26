'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SessionData {
  id: string;
  qr_code_data: string;
  created_at: string;
}

export default function AdminPage() {
  const [qrCode, setQrCode] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionUrl, setSessionUrl] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const createSession = async () => {
    setLoading(true);
    setError('');
    setQrCode(null);

    try {
      const res = await fetch(`${backendUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trainer_id: 'trainer1', 
          athlete_count: 15 
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success && data.data) {
        setQrCode(data.data);
        // Extract URL from QR code data (it's embedded in the Data URL)
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/checkin/${data.data.id}?token=...`;
        setSessionUrl(url);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Make sure backend is running on ' + backendUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Trainer Panel</h1>
          <div className="w-16"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create Training Session
            </h2>
            <p className="text-gray-600">
              Generate a QR code for your athletes to check in
            </p>
          </div>

          {/* Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={createSession}
              disabled={loading}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition transform ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {loading ? 'Generating QR Code...' : 'Generate QR Code'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-bold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-200 p-8 rounded-lg">
              <div className="bg-white p-6 rounded-lg inline-block mx-auto block">
                {/* QR Code as image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode.qr_code_data}
                  alt="Session QR Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Session ID:</strong> {qrCode.id.substring(0, 8)}...
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Created: {new Date(qrCode.created_at).toLocaleTimeString()}
                </p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">
                    Athletes scan this QR code with their phones to start check-in
                  </p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {sessionUrl}
                  </p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-xs text-gray-600 mt-1">Athletes</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <div className="text-xs text-gray-600 mt-1">Status</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">∞</div>
                  <div className="text-xs text-gray-600 mt-1">Valid Until Closed</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm font-bold text-amber-900 mb-2">📋 Instructions:</p>
                <ol className="text-sm text-amber-900 space-y-1 list-decimal list-inside">
                  <li>Display this QR code to your athletes</li>
                  <li>Each athlete scans with their phone</li>
                  <li>They fill in pre-workout form (≤30 sec)</li>
                  <li>After training, they submit post-workout form</li>
                  <li>See aggregated results once session is closed</li>
                </ol>
              </div>

              {/* Generate New */}
              <div className="flex gap-4 mt-6 justify-center">
                <button
                  onClick={() => setQrCode(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-bold transition"
                >
                  Generate New Session
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!qrCode && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> Click the button above to generate a QR code that athletes can scan with their phones to start the check-in process.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Backend: {backendUrl}</p>
        </div>
      </div>
    </div>
  );
}
