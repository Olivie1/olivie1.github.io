'use client';

import { useState } from 'react';

interface PreCheckinFormProps {
  sessionId: string;
  onSuccess: (athleteCode: string) => void;
}

type Step = 'code' | 'sleep' | 'fatigue' | 'stress' | 'pain';

interface FormData {
  code: string;
  sleep: number;
  fatigue: number;
  stress: number;
  pain: boolean;
}

export default function PreCheckinForm({ sessionId, onSuccess }: PreCheckinFormProps) {
  const [step, setStep] = useState<Step>('code');
  const [formData, setFormData] = useState<FormData>({
    code: '',
    sleep: 3,
    fatigue: 3,
    stress: 3,
    pain: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const steps: Array<{ key: Step; label: string; icon: string }> = [
    { key: 'code', label: 'What\'s your athlete code?', icon: '🆔' },
    { key: 'sleep', label: 'How well did you sleep?', icon: '😴' },
    { key: 'fatigue', label: 'How tired are you?', icon: '😫' },
    { key: 'stress', label: 'How stressed are you?', icon: '😰' },
    { key: 'pain', label: 'Any pain or injuries?', icon: '🤕' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const currentStepData = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, code: e.target.value.toUpperCase() });
  };

  const handleNext = async () => {
    setError('');

    if (step === 'code') {
      if (!formData.code.trim()) {
        setError('Please enter your athlete code');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/checkin/pre`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            athlete_code: formData.code,
            sleep: formData.sleep,
            fatigue: formData.fatigue,
            stress: formData.stress,
            pain: formData.pain,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Failed to submit check-in');
          return;
        }

        setSubmitted(true);
        setTimeout(() => {
          onSuccess(formData.code);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setStep(steps[nextIndex].key);
      }
    }
  };

  const handleScaleChange = (value: number) => {
    if (step === 'sleep') {
      setFormData({ ...formData, sleep: value });
    } else if (step === 'fatigue') {
      setFormData({ ...formData, fatigue: value });
    } else if (step === 'stress') {
      setFormData({ ...formData, stress: value });
    }
  };

  const handlePainChange = (value: boolean) => {
    setFormData({ ...formData, pain: value });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 gap-4 p-4">
        <div className="text-6xl animate-bounce">✅</div>
        <h1 className="text-3xl font-bold text-green-900">Pre-Check-in Recorded!</h1>
        <p className="text-lg text-green-700">Moving to post-workout check-in...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-4">{currentStepData.icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pre-Workout Check-in
        </h1>
        <p className="text-gray-600">Step {currentStepIndex + 1} of {steps.length}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="text-2xl font-bold text-center text-gray-900 max-w-md mb-4">
        {currentStepData.label}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md w-full">
          {error}
        </div>
      )}

      {/* Input - Code */}
      {step === 'code' && (
        <input
          type="text"
          value={formData.code}
          onChange={handleCodeChange}
          placeholder="e.g., A001"
          className="px-6 py-4 border-2 border-gray-300 rounded-lg text-xl w-full max-w-md text-center font-mono placeholder-gray-400 focus:border-blue-600 focus:outline-none"
          autoFocus
          disabled={loading}
        />
      )}

      {/* Scale Buttons - Sleep/Fatigue/Stress */}
      {['sleep', 'fatigue', 'stress'].includes(step) && (
        <div className="flex gap-3 flex-wrap justify-center max-w-md">
          {[1, 2, 3, 4, 5].map((val) => {
            const currentValue =
              step === 'sleep'
                ? formData.sleep
                : step === 'fatigue'
                  ? formData.fatigue
                  : formData.stress;
            return (
              <button
                key={val}
                onClick={() => handleScaleChange(val)}
                className={`w-16 h-16 rounded-lg font-bold text-lg transition transform hover:scale-110 ${
                  currentValue === val
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}

      {/* Boolean Buttons - Pain */}
      {step === 'pain' && (
        <div className="flex gap-4 max-w-md">
          {[
            { label: 'YES', value: true },
            { label: 'NO', value: false },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => handlePainChange(value)}
              className={`flex-1 px-8 py-6 rounded-lg font-bold text-lg transition transform hover:scale-105 ${
                formData.pain === value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={loading || (step === 'code' && !formData.code.trim())}
        className={`px-8 py-4 rounded-lg font-bold text-lg w-full max-w-md transition transform ${
          loading || (step === 'code' && !formData.code.trim())
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
        }`}
      >
        {loading ? 'Submitting...' : step === 'code' ? 'Submit' : 'Next'}
      </button>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 max-w-md mt-4">
        <p>
          {step === 'code'
            ? 'Enter the code from your athlete ID card'
            : step === 'sleep'
              ? 'Scale: 1 (very bad sleep) - 5 (perfect sleep)'
              : step === 'fatigue'
                ? 'Scale: 1 (very fresh) - 5 (exhausted)'
                : step === 'stress'
                  ? 'Scale: 1 (relaxed) - 5 (very stressed)'
                  : 'Answer honestly - this helps us track your health'}
        </p>
      </div>
    </div>
  );
}
