'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import PreCheckinForm from '@/components/PreCheckinForm';
import PostCheckinForm from '@/components/PostCheckinForm';

type Stage = 'pre' | 'post' | 'success';

export default function CheckinPage({ params }: { params: { sessionId: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [stage, setStage] = useState<Stage>('pre');
  const [athleteCode, setAthleteCode] = useState('');

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 gap-4 p-4">
        <div className="text-5xl">❌</div>
        <h1 className="text-3xl font-bold text-red-900">Invalid Link</h1>
        <p className="text-lg text-red-700">QR code token is missing or expired</p>
        <p className="text-sm text-gray-600 mt-4">
          Please scan a valid QR code from your trainer
        </p>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white gap-6 p-4">
        <div className="text-7xl">🎉</div>
        <h1 className="text-4xl font-bold text-green-900 text-center">All Set!</h1>
        <p className="text-xl text-green-700 text-center max-w-md">
          Thank you for completing your check-in
        </p>
        <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg mt-4 text-center max-w-md">
          <p className="text-sm">
            Your data has been recorded and will help your trainer optimize your training plan.
          </p>
        </div>
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>You can close this browser window</p>
          <p className="text-xs mt-2">Session: {params.sessionId.substring(0, 8)}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {stage === 'pre' && (
        <PreCheckinForm
          sessionId={params.sessionId}
          onSuccess={(code) => {
            setAthleteCode(code);
            setStage('post');
          }}
        />
      )}
      {stage === 'post' && (
        <PostCheckinForm
          sessionId={params.sessionId}
          athleteCode={athleteCode}
          onSuccess={() => setStage('success')}
        />
      )}
    </>
  );
}
