'use client';

import { useState } from 'react';

interface PostCheckinFormProps {
  sessionId: string;
  athleteCode: string;
  onSuccess: () => void;
}

export default function PostCheckinForm({
  sessionId,
  athleteCode,
  onSuccess,
}: PostCheckinFormProps) {
  const [rpe, setRpe] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${backendUrl}/api/checkin/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          athlete_code: athleteCode,
          rpe,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to submit post-check-in');
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 gap-4 p-4">
        <div className="text-6xl animate-bounce">✅</div>
        <h1 className="text-3xl font-bold text-green-900">Check-in Complete!</h1>
        <p className="text-lg text-green-700">Thank you for your data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Post-Workout Check-in
        </h1>
        <p className="text-gray-600">How was your workout?</p>
      </div>

      {/* Question */}
      <h2 className="text-2xl font-bold text-center text-gray-900 max-w-md mb-4">
        Rate your effort (1-10)
      </h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md w-full">
          {error}
        </div>
      )}

      {/* RPE Scale */}
      <div className="flex gap-2 flex-wrap justify-center max-w-md">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
          <button
            key={val}
            onClick={() => setRpe(val)}
            className={`w-14 h-14 rounded-lg font-bold text-lg transition transform hover:scale-110 ${
              rpe === val
                ? 'bg-purple-600 text-white shadow-lg scale-110'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* RPE Description */}
      <div className="text-center max-w-md">
        <p className="text-sm text-gray-600">
          {rpe <= 3 && '🟢 Light effort'}
          {rpe > 3 && rpe <= 5 && '🟡 Moderate effort'}
          {rpe > 5 && rpe <= 7 && '🟠 Hard effort'}
          {rpe > 7 && '🔴 Maximum effort'}
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`px-8 py-4 rounded-lg font-bold text-lg w-full max-w-md transition transform ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
        }`}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 max-w-md mt-4">
        <p>
          Rate your perceived exertion on a scale of 1-10
          <br />
          1 = very light, 10 = maximum effort
        </p>
      </div>

      {/* Athlete Code */}
      <div className="text-xs text-gray-500 mt-4">
        Athlete: {athleteCode}
      </div>
    </div>
  );
}
