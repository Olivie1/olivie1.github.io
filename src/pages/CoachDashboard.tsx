import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentSession } from '../App';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';
interface ActiveSession {
  id: string;
  qr_code_data: string;
}

interface CheckInResponse {
  id: string;
  athlete_id: string;
  pre_check_in?: {
    sleep: number;
    fatigue: number;
    stress: number;
    pain: boolean;
  };
  post_check_in?: {
    rpe: number;
  };
}

interface SessionSummary {
  total_athletes: number;
  filled_pre: number;
  filled_post: number;
  pre_fill_rate: number;
  post_fill_rate: number;
  high_fatigue_count: number;
  high_stress_count: number;
  pain_count: number;
  avg_rpe?: number;
  ai_note?: string;
}

interface CoachDashboardProps {
  token?: string;
  onLogout: () => void;
}

export default function CoachDashboard({ token }: CoachDashboardProps) {
  const navigate = useNavigate();

  const trainerId = currentSession?.user?.id || 'trainer-main';
  const apiUrl = API_BASE_URL;

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [athleteCount, setAthleteCount] = useState<number>(15);
  
  const [liveCheckIns, setLiveCheckIns] = useState<CheckInResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token && !currentSession?.user) {
      navigate('/coach-login');
    }
  }, [navigate, token]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (activeSession) {
      const fetchCheckIns = async () => {
        try {
          const authToken = token || localStorage.getItem('coach_token');
          const headers: Record<string, string> = {};
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          const res = await fetch(`${apiUrl}/api/checkin/sessions/${activeSession.id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            setLiveCheckIns(data.data || []);
          }
        } catch (e) {
          console.error('Failed to fetch check-ins', e);
        }
      };
      
      fetchCheckIns();
      intervalId = setInterval(fetchCheckIns, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSession, apiUrl, token]);

  const handleCreateSession = async () => {
    setLoading(true);
    setError('');
    try {
      const authToken = token || localStorage.getItem('coach_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trainer_id: trainerId, athlete_count: athleteCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      setActiveSession(data.data);
      setSummary(null);
      setLiveCheckIns([]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create session'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    setError('');
    try {
      const authToken = token || localStorage.getItem('coach_token');
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${apiUrl}/api/sessions/${activeSession.id}/close`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close session');
      
      setSummary(data.data.aggregated_response);
      setActiveSession(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to close session'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page min-h-screen">
      <div className="bg-panel border-b ds-divider mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display text-chalk">Дашборд тренера</h1>
              <p className="text-chalk-dim mt-1">Live-управление тренировкой</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && (
          <div className="ds-error mb-6 p-4 text-sm">
            {error}
          </div>
        )}

        {!activeSession && !summary && (
          <div className="ds-card ds-mobile-card p-8 text-center max-w-lg mx-auto mt-12">
            <h2 className="text-2xl font-display text-chalk mb-4">Начать тренировку</h2>
            <p className="text-chalk-dim mb-6">
              Создайте новую сессию, чтобы сгенерировать QR-код для спортсменов.
            </p>
            
            <div className="mb-8 text-left">
              <label className="block text-chalk-dim text-sm mb-2">Ожидаемое количество участников:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={athleteCount}
                onChange={(e) => setAthleteCount(Number(e.target.value))}
                className="ds-input p-3 focus:outline-none focus:border-rope"
              />
            </div>

            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="ds-primary py-4 px-8 w-full"
            >
              {loading ? 'Создание...' : 'Сгенерировать QR-код'}
            </button>
          </div>
        )}

        {activeSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="ds-card p-6 text-center">
                <h2 className="text-xl font-display text-chalk mb-4">Отсканируйте код</h2>
                <div className="bg-white p-4 inline-block rounded-lg mb-6">
                  <img src={activeSession.qr_code_data} alt="Session QR" className="w-48 h-48" />
                </div>
                <p className="text-chalk-dim mb-8">Спортсмены должны отсканировать код, чтобы пройти Pre-чек-ин.</p>
                <button
                  onClick={handleCloseSession}
                  disabled={loading}
                  className="ds-ghost py-4 px-8 w-full"
                >
                  {loading ? 'Завершение...' : 'Завершить тренировку'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="ds-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display text-chalk">Live Чек-ины ({liveCheckIns.length})</h2>
                  <div className="flex items-center space-x-2">
                    <span className="ds-led ds-led-ok"></span>
                    <span className="text-sm text-chalk-dim">Обновляется...</span>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {liveCheckIns.length === 0 ? (
                    <div className="text-center py-12 text-chalk-dim">
                      Пока никто не присоединился.
                    </div>
                  ) : (
                    liveCheckIns.map(checkIn => (
                      <div key={checkIn.id} className="ds-metric p-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                        <div className="font-semibold text-chalk">{checkIn.athlete_id}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {checkIn.pre_check_in ? (
                            <>
                              {checkIn.pre_check_in.pain && (
                                <span className="ds-flag"><span className="ds-led ds-led-high"></span>Боль</span>
                              )}
                              {checkIn.pre_check_in.fatigue >= 4 && (
                                <span className="ds-flag"><span className="ds-led ds-led-warn"></span>Усталость</span>
                              )}
                              <span className="text-flag-ok">Pre ✓</span>
                            </>
                          ) : (
                            <span className="text-chalk-dim">Ждем...</span>
                          )}

                          {checkIn.post_check_in ? (
                            <span className="text-flag-ok ml-4">Post ✓ (RPE: {checkIn.post_check_in.rpe})</span>
                          ) : (
                            <span className="text-chalk-dim ml-4"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {summary && !activeSession && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="ds-card ds-mobile-card p-8">
              <h2 className="text-3xl font-display text-chalk mb-8">Итоги тренировки</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="ds-metric p-4 text-center">
                  <div className="text-sm text-chalk-dim mb-1">Спортсменов</div>
                  <div className="ds-metric-value text-2xl text-chalk">{summary.total_athletes}</div>
                </div>
                <div className="ds-metric p-4 text-center">
                  <div className="text-sm text-chalk-dim mb-1">Pre-чек-ины</div>
                  <div className="ds-metric-value text-2xl text-chalk">{summary.filled_pre} ({summary.pre_fill_rate}%)</div>
                </div>
                <div className="ds-metric p-4 text-center">
                  <div className="text-sm text-chalk-dim mb-1">Средний RPE</div>
                  <div className="ds-metric-value text-2xl text-chalk">{summary.avg_rpe ? summary.avg_rpe.toFixed(1) : '-'}</div>
                </div>
                <div className="ds-metric p-4 text-center">
                  <div className="text-sm text-chalk-dim mb-1">Жалобы на боль</div>
                  <div className="ds-metric-value text-2xl text-chalk inline-flex items-center gap-2"><span className="ds-led ds-led-high"></span>{summary.pain_count}</div>
                </div>
              </div>

              {summary.ai_note && (
                <div className="mt-8 p-6 border-t ds-divider">
                  <h3 className="font-display text-xl text-chalk mb-2">🤖 AI Аналитика</h3>
                  <p className="text-chalk whitespace-pre-line">{summary.ai_note}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSummary(null);
                setActiveSession(null);
              }}
              className="ds-primary py-4 px-8 w-full md:w-auto"
            >
              Начать новую сессию
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
