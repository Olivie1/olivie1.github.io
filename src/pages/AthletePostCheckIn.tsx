import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';

export const AthletePostCheckIn: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [rpe, setRpe] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const deviceToken = localStorage.getItem('device_token');
    
    if (!deviceToken) {
      setError('Устройство не авторизовано. Вернитесь на страницу входа.');
      return;
    }

    if (!sessionId) {
      setError('Сессия не найдена.');
      return;
    }

    if (rpe === null) {
      setError('Пожалуйста, выберите уровень нагрузки.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/checkin/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          device_token: deviceToken,
          rpe: rpe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке данных');
      }

      navigate('/success');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Произошла непредвиденная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center text-center">
        {error && (
          <div className="ds-error mb-6 p-4 text-sm text-center">
            {error}
          </div>
        )}

        <h2 className="text-3xl font-display text-chalk mb-4">Оцени тренировку</h2>
        <p className="text-chalk-dim mb-8">RPE: 1 (Очень легко) — 10 (Максимальная нагрузка)</p>
        
        <div className="grid grid-cols-5 gap-x-2 gap-y-3 justify-items-center w-full max-w-sm mx-auto mb-12">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
            <button
              key={val}
              onClick={() => setRpe(val)}
              className={`ds-scale flex items-center justify-center
                ${rpe === val 
                  ? 'ds-scale-active' 
                  : ''
                }`}
            >
              {val}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={rpe === null || loading}
          className="ds-primary py-4 px-8 w-full"
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
};

export default AthletePostCheckIn;
