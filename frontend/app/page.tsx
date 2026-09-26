import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-6xl">⚡</div>
      <h1 className="text-5xl font-bold text-center text-gray-900">
        Recovery Check-in
      </h1>
      <p className="text-xl text-gray-600 text-center max-w-md">
        Pre- and post-workout check-in platform for athlete recovery tracking
      </p>

      <div className="flex gap-4 flex-col sm:flex-row">
        <Link
          href="/admin"
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition transform hover:scale-105"
        >
          Trainer: Create Session
        </Link>
        <Link
          href="/info"
          className="px-8 py-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-bold text-lg transition"
        >
          Learn More
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-bold text-lg mb-2">Pre-Workout</h3>
          <p className="text-gray-600 text-sm">Track sleep, fatigue, stress, and pain before training</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">🏋️</div>
          <h3 className="font-bold text-lg mb-2">Post-Workout</h3>
          <p className="text-gray-600 text-sm">Rate effort and recovery metrics after training</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-bold text-lg mb-2">AI Insights</h3>
          <p className="text-gray-600 text-sm">Get automatic recommendations based on team data</p>
        </div>
      </div>
    </div>
  );
}

