import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';

export const AthleteRegistration: React.FC = () => {
  const [athleteCode, setAthleteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id') || localStorage.getItem('session_id') || '';

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('session_id', sessionId);
    }
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteCode.trim()) {
      setError('Пожалуйста, введите код спортсмена');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/athletes/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          athlete_code: athleteCode.trim().toUpperCase(),
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при регистрации');
      }

      // Сохраняем device_token
      localStorage.setItem('device_token', data.data.device_token);

      // Редирект на pre-чек-ин
      navigate(`/pre-checkin/${sessionId}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Произошла непредвиденная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page min-h-screen flex flex-col justify-center items-center px-4 py-8">
      <div className="ds-card ds-mobile-card w-full max-w-md p-8">
        <h1 className="text-3xl text-chalk text-center mb-2">Вход</h1>
        <p className="text-chalk-dim text-center mb-8 text-sm">
          Введите ваш код для присоединения к сессии
        </p>

        {error && (
          <div className="ds-error mb-6 p-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="athleteCode" className="block text-chalk-dim mb-2 text-sm uppercase tracking-wider">
              Код спортсмена
            </label>
            <input
              id="athleteCode"
              type="text"
              value={athleteCode}
              onChange={(e) => setAthleteCode(e.target.value)}
              placeholder="Например, A001"
              className="ds-input text-xl p-4 focus:border-rope focus:outline-none uppercase text-center"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !athleteCode.trim()}
            className="ds-primary w-full text-lg py-4 px-6"
          >
            {loading ? 'Загрузка...' : 'Присоединиться'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AthleteRegistration;
