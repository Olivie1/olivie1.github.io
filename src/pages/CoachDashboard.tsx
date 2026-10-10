import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentSession } from '../App';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';
import { PendingSessionCreation, readPendingCreation, persistCreation, clearPendingCreation } from '../api/recovery';
interface ActiveSession {
  id: string;
  qr_code_data: string;
  status: string;
  created_at: string;
  aggregated_response?: SessionSummary | null;
}

interface CheckInResponse {
  id: string;
  participant_id: string;
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
  extended_summary?: { facts: string[]; disclaimer: string };
}

interface CoachDashboardProps {
  token?: string;
  onLogout: () => void;
}

export default function CoachDashboard({ token }: CoachDashboardProps) {
  const navigate = useNavigate();

  const trainerId = 'trainer-main';
  const apiUrl = API_BASE_URL;

  const [history, setHistory] = useState<ActiveSession[]>([]);
  const [displayedSessionId, setDisplayedSessionId] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [pendingCreation, setPendingCreation] = useState<PendingSessionCreation | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [candidates, setCandidates] = useState<{ participant_id: string; last_measurement: string | null }[]>([]);
  const [demoSummary, setDemoSummary] = useState<{ facts: string[]; disclaimer: string } | null>(null);
  const [selectedCodes, setSelectedCodes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupSummary, setGroupSummary] = useState<{ facts: string[]; disclaimer: string } | null>(null);
  const [athleteCount, setAthleteCount] = useState<number>(15);
  
  const [liveCheckIns, setLiveCheckIns] = useState<CheckInResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token && !currentSession?.user) {
      navigate('/coach-login');
    }
  }, [navigate, token]);

  const showSession = useCallback((session: ActiveSession) => {
    setDisplayedSessionId(session.id);
    setHistory(previous => previous.some(item => item.id === session.id) ? previous.map(item => item.id === session.id ? session : item) : [session, ...previous]);
    setLiveCheckIns([]);
    setGroupSummary(null);
    if (session.status === 'active') {
      setActiveSession(session);
      setSummary(null);
    } else {
      setActiveSession(null);
      setSummary(session.aggregated_response || null);
    }
    navigate(`/dashboard?session_id=${encodeURIComponent(session.id)}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      setRestoring(true);
      try {
        const pending = readPendingCreation(trainerId);
        setPendingCreation(pending);
        if (pending) {
          setAthleteCount(pending.athlete_count);
          setSelectedCodes(pending.extended_athlete_ids.join(', '));
          setSelectedParticipants(pending.extended_participant_ids || []);
        }
        const headers = { Authorization: `Bearer ${token || localStorage.getItem('coach_token')}` };
        const r = await fetch(`${apiUrl}/api/sessions?limit=50`, { headers });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || d.detail || 'Ошибка восстановления сессий');
        if (cancelled) return;
        const sessions: ActiveSession[] = d.data;
        setHistory(sessions);
        const rememberedId = new URLSearchParams(window.location.search).get('session_id');
        let chosen = sessions.find(session => session.id === rememberedId);
        if (rememberedId && !chosen) {
          const detail = await fetch(`${apiUrl}/api/sessions/${encodeURIComponent(rememberedId)}`, { headers });
          const result = await detail.json(); if (!detail.ok) throw new Error(result.error || result.detail || 'Сессия недоступна');
          chosen = result.data;
        }
        if (!chosen && !pending) chosen = sessions.find(session => session.status === 'active') || sessions[0];
        if (chosen && !cancelled) showSession(chosen);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Ошибка восстановления сессий'));
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [apiUrl, token, trainerId, showSession]);

  useEffect(() => {
    if (!activeSession) return;
    let cancelled = false;
    let fetching = false;
    const fetchCheckIns = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const headers = { Authorization: `Bearer ${token || localStorage.getItem('coach_token')}` };
        const state = await fetch(`${apiUrl}/api/sessions/${activeSession.id}`, { headers });
        const current = await state.json(); if (!state.ok) throw new Error(current.error || current.detail || 'Ошибка обновления');
        if (cancelled) return;
        if (current.data.status !== 'active') { showSession(current.data); return; }
        const res = await fetch(`${apiUrl}/api/checkin/sessions/${activeSession.id}`, { headers });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || data.detail || 'Ошибка загрузки ответов');
        if (cancelled) return;
        setLiveCheckIns(data.data || []);
        const summaryRes = await fetch(`${apiUrl}/api/sessions/${activeSession.id}/summary`, { headers });
        const summaryData = await summaryRes.json(); if (!summaryRes.ok) throw new Error(summaryData.error || summaryData.detail || 'Ошибка загрузки сводки');
        if (!cancelled) setGroupSummary(summaryData.data);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'Ошибка обновления'));
      } finally { fetching = false; }
    };
    fetchCheckIns();
    const intervalId = setInterval(fetchCheckIns, 5000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [activeSession, apiUrl, token, showSession]);

  const loadOptional = async (kind: 'candidates' | 'demo-summary') => {
    setError('');
    try {
      const r = await fetch(`${apiUrl}/api/extended/${kind}`, { headers: { Authorization: `Bearer ${token || localStorage.getItem('coach_token')}` } });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || d.detail);
      if (kind === 'candidates') setCandidates(d.data); else setDemoSummary(d.data);
    } catch (e) { setError(getErrorMessage(e, 'Ошибка загрузки')); }
  };

  const handleCreateSession = async () => {
    if (loading || restoring) return;
    setLoading(true);
    setError('');
    try {
      const pending = readPendingCreation(trainerId) || {
        request_id: crypto.randomUUID(),
        athlete_count: athleteCount,
        extended_athlete_ids: selectedCodes.split(/[\s,;]+/).filter(Boolean).map(code => code.toUpperCase()),
        extended_participant_ids: selectedParticipants,
      };
      persistCreation(trainerId, pending);
      setPendingCreation(pending);
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token || localStorage.getItem('coach_token')}` };
      const res = await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST', headers, body: JSON.stringify({ trainer_id: trainerId, ...pending }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 || res.status === 422) { clearPendingCreation(trainerId); setPendingCreation(null); }
        throw new Error(data.error || data.detail || 'Не удалось создать сессию');
      }
      navigate(`/dashboard?session_id=${encodeURIComponent(data.data.id)}`, { replace: true });
      clearPendingCreation(trainerId);
      setPendingCreation(null);
      setSelectedCodes('');
      setSelectedParticipants([]);
      let session: ActiveSession = data.data;
      if (session.status !== 'active') {
        const detail = await fetch(`${apiUrl}/api/sessions/${session.id}`, { headers });
        const result = await detail.json(); if (!detail.ok) throw new Error(result.error || result.detail || 'Ошибка загрузки итогов');
        session = result.data;
        showSession(session);
      } else showSession(session);
      setHistory(previous => [session, ...previous.filter(item => item.id !== session.id)]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Не удалось создать сессию. Повторите запрос.'));
    } finally { setLoading(false); }
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
      const closed = { ...activeSession, status: 'closed', aggregated_response: data.data.aggregated_response };
      setHistory(previous => previous.map(session => session.id === closed.id ? closed : session));
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
        {restoring && <p>Восстановление сессий…</p>}
        {history.length > 0 && <label className="block mb-4">Тренировочные сессии:
          <select className="ds-input p-3" disabled={restoring || loading} value={displayedSessionId} onChange={e => { const chosen = history.find(session => session.id === e.target.value); if (chosen) showSession(chosen); }}>
            <option value="">Выберите сессию</option>
            {history.map(session => <option key={session.id} value={session.id}>{new Date(session.created_at).toLocaleString('ru')} — {session.status === 'active' ? 'активна' : 'завершена'}</option>)}
          </select>
        </label>}
        {pendingCreation && <div role="status"><p>Создание сессии ещё не подтверждено. Повторите тот же запрос — новая копия не появится.</p><button className="ds-ghost p-3" disabled={loading || restoring} onClick={handleCreateSession}>Восстановить создание</button></div>}
        <button className="ds-ghost p-3 mb-4" onClick={() => loadOptional('demo-summary')}>Демо: показать сводку</button>
        {demoSummary && <div className="ds-card p-6 mb-6"><h2 className="text-2xl">Демо — вымышленные данные</h2>{demoSummary.facts.map((fact, i) => <p key={i}>{fact}</p>)}<p>{demoSummary.disclaimer}</p><button className="ds-ghost p-3" onClick={() => setDemoSummary(null)}>Закрыть демо</button></div>}
        {error && (
          <div className="ds-error mb-6 p-4 text-sm">
            {error}
          </div>
        )}

        {!restoring && !activeSession && !summary && (
          <div className="ds-card ds-mobile-card p-8 text-center max-w-lg mx-auto mt-12">
            <h2 className="text-2xl font-display text-chalk mb-4">Начать тренировку</h2>
            <p className="text-chalk-dim mb-6">
              Создайте новую сессию, чтобы сгенерировать QR-код для спортсменов.
            </p>
            
            <div className="mb-8 text-left">
              <label className="block text-chalk-dim text-sm mb-2">Ожидаемое количество участников:</label>
              <input
                type="number"
                disabled={!!pendingCreation || loading}
                min="1"
                max="50"
                value={athleteCount}
                onChange={(e) => setAthleteCount(Number(e.target.value))}
                className="ds-input p-3 focus:outline-none focus:border-rope"
              />
            </div>

            <button className="ds-ghost p-3 mb-3" onClick={() => loadOptional('candidates')}>Подсказка выбора по истории измерений</button>
            {candidates.length > 0 && <div className="text-left mb-4"><p>Сначала без измерений, затем наиболее давние. Выбор остаётся за вами.</p>{candidates.map(c => <label key={c.participant_id} className="block"><input type="checkbox" disabled={!!pendingCreation || loading} checked={selectedParticipants.includes(c.participant_id)} onChange={e => setSelectedParticipants(previous => e.target.checked ? [...new Set([...previous, c.participant_id])] : previous.filter(id => id !== c.participant_id))} /> Участник {c.participant_id.slice(0, 12)} — {c.last_measurement ? new Date(c.last_measurement).toLocaleDateString('ru') : 'нет измерений'}</label>)}</div>}
            <label className="block text-left mb-6">Секретные коды новых участников расширенного режима (через пробел или запятую):
              <input id="extendedCodes" type="password" autoComplete="off" className="ds-input p-3" disabled={!!pendingCreation || loading} value={selectedCodes} onChange={e => setSelectedCodes(e.target.value)} />
            </label>
            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="ds-primary py-4 px-8 w-full"
            >
              {loading ? 'Создание...' : pendingCreation ? 'Повторить создание' : 'Сгенерировать QR-код'}
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
                        <div className="font-semibold text-chalk">Участник {checkIn.participant_id?.slice(0, 12) || checkIn.id.slice(0, 12)}</div>
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

        {activeSession && groupSummary && <div className="ds-card p-6 mt-6"><h2 className="text-xl">Групповая сводка расширенного режима</h2>{groupSummary.facts.map((fact, i) => <p key={i}>{fact}</p>)}<p>{groupSummary.disclaimer}</p></div>}
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

              {summary.extended_summary && <div><h3 className="text-xl">Групповая сводка</h3>{summary.extended_summary.facts.map((fact, i) => <p key={i}>{fact}</p>)}<p>{summary.extended_summary.disclaimer}</p></div>}

            </div>

            <button
              onClick={() => {
                setSummary(null);
                setActiveSession(null);
                setDisplayedSessionId('');
                navigate('/dashboard', { replace: true });
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
