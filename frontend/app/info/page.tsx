import Link from 'next/link';

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">How It Works</h1>
          <div className="w-16"></div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Section 1 */}
          <div className="mb-8">
            <div className="flex gap-4 mb-4">
              <div className="text-4xl">📊</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pre-Workout Assessment
                </h2>
                <p className="text-gray-600 mb-3">
                  Before training starts, athletes complete a quick check-in (≤30 seconds):
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li><strong>Sleep Quality:</strong> Rate how well you slept last night (1-5)</li>
                  <li><strong>Fatigue Level:</strong> How tired do you feel right now? (1-5)</li>
                  <li><strong>Stress Level:</strong> How stressed are you? (1-5)</li>
                  <li><strong>Pain/Injuries:</strong> Any pain or active injuries? (Yes/No)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-8 border-t pt-8">
            <div className="flex gap-4 mb-4">
              <div className="text-4xl">🏋️</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Post-Workout Assessment
                </h2>
                <p className="text-gray-600 mb-3">
                  After training, athletes rate their workout intensity:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li><strong>Perceived Exertion (RPE):</strong> Rate effort level 1-10</li>
                  <li>1 = Very light effort</li>
                  <li>10 = Maximum effort</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-8 border-t pt-8">
            <div className="flex gap-4 mb-4">
              <div className="text-4xl">📱</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  For Trainers
                </h2>
                <p className="text-gray-600 mb-3">
                  Trainers can easily manage sessions:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Create a training session in admin panel</li>
                  <li>Generate unique QR code for athletes to scan</li>
                  <li>Track check-in completion in real-time</li>
                  <li>Get AI-powered insights on team recovery status</li>
                  <li>Adjust training load based on athlete feedback</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-8 border-t pt-8">
            <div className="flex gap-4 mb-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  AI Insights
                </h2>
                <p className="text-gray-600 mb-3">
                  Once a session ends, you get automatic insights:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Check-in completion rate %</li>
                  <li>Number of athletes with high fatigue</li>
                  <li>Number of athletes with high stress</li>
                  <li>Athletes reporting pain or injuries</li>
                  <li>Average perceived exertion (RPE)</li>
                  <li>AI-generated recommendations for next session</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="mb-8 border-t pt-8">
            <div className="flex gap-4 mb-4">
              <div className="text-4xl">🎯</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Benefits
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>⚡ Quick feedback - no setup, just scan & go</li>
                  <li>📊 Data-driven training - optimize based on real metrics</li>
                  <li>🏥 Injury prevention - identify at-risk athletes early</li>
                  <li>😊 Athlete wellbeing - show you care about their health</li>
                  <li>🤖 AI support - get intelligent recommendations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-8 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first training session and see how it works
            </p>
            <Link
              href="/admin"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition"
            >
              Go to Trainer Panel
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                How long does a check-in take?
              </h3>
              <p className="text-gray-600">
                Typically 20-30 seconds per athlete. Most of that time is reading the questions.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-2">
                Do athletes need an account?
              </h3>
              <p className="text-gray-600">
                No! Just use your athlete code (e.g., A001). Completely anonymous and privacy-friendly.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-2">
                What data is collected?
              </h3>
              <p className="text-gray-600">
                Only survey responses (sleep, fatigue, stress, pain, RPE). No personal data or device info.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-2">
                Can athletes redo their check-in?
              </h3>
              <p className="text-gray-600">
                Pre-check-in can only be done once per session. Ask trainer if you need to redo it.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-2">
                What happens after the session ends?
              </h3>
              <p className="text-gray-600">
                Trainer closes the session and receives aggregated insights + AI recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
