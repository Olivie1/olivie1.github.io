import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentSession } from '../App';
import { Insight, Reward } from '../types/index';
import { getAthleteInsights, getAllRewards } from '../api/index';

interface AthleteInsightsProps {
  onLogout: () => void;
}

export default function AthleteInsights({ onLogout: _onLogout }: AthleteInsightsProps) {
  const navigate = useNavigate();

  if (!currentSession?.user) {
    navigate('/register');
    return null;
  }

  const athleteId = currentSession.user.id;

  const [insights, setInsights] = useState<Insight[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const insightsData = await getAthleteInsights(athleteId);
        const rewardsData = await getAllRewards();

        setInsights(insightsData);
        setRewards(rewardsData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [athleteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink">
        <div className="text-center">
          <div className="text-2xl font-display text-rope mb-2">Загрузка...</div>
        </div>
      </div>
    );
  }

  const getInsightColor = (type?: string) => {
    if (type === 'warning') return 'bg-flag-high/10 border-flag-high text-flag-high';
    if (type === 'achievement') return 'bg-flag-ok/10 border-flag-ok text-flag-ok';
    return 'bg-tatami border-tatami text-chalk';
  };

  return (
    <div className="ds-page min-h-screen">
      {/* Header */}
      <div className="bg-panel border-b ds-divider mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display text-chalk">Мои инсайты</h1>
              <p className="text-chalk-dim mt-1">Персональные рекомендации на основе ваших данных</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="ds-primary px-4 py-2"
            >
              На главную 📋
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Insights Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-display text-chalk mb-6">📊 Анализ вашего восстановления</h2>

          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-md p-6 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-3xl">
                      {insight.type === 'warning' ? '⚠️' : insight.type === 'achievement' ? '🏆' : '💡'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{insight.message}</p>
                      <p className="text-sm opacity-80 mt-1">От {insight.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ds-card p-8 text-center text-chalk-dim">
              <p className="text-lg">Пока нет инсайтов. Заполни несколько опросов, и система начнёт давать рекомендации! 📝</p>
            </div>
          )}
        </div>

        {/* Rewards Section */}
        <div>
          <h2 className="text-2xl font-display text-chalk mb-6">🏅 Челленджи и награды</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => (
              <div key={reward.id} className="ds-card p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{reward.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-chalk">{reward.title}</h3>
                    <p className="text-sm text-chalk-dim mt-1">{reward.description}</p>
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-tatami uppercase">Условие:</div>
                      <p className="text-sm text-chalk-dim">{reward.condition}</p>
                    </div>
                    {reward.partnerName && (
                      <p className="text-xs text-tatami mt-2 pt-2 border-t border-tatami">
                        От {reward.partnerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-chalk-dim mt-8 text-sm">
            ✨ Челленджи помогают мотивировать себя на качественное восстановление
          </p>
        </div>
      </div>
    </div>
  );
}
