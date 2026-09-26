import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';

export const AthletePreCheckIn: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [sleep, setSleep] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [pain, setPain] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

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

    if (sleep === null || fatigue === null || stress === null || pain === null) {
      setError('Пожалуйста, ответьте на все вопросы.');
      return;
    }
      setLoading(true);
    setError('');

      try {
      const response = await fetch(`${API_BASE_URL}/api/checkin/pre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          device_token: deviceToken,
          sleep,
          fatigue,
          stress,
          pain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке данных');
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect somewhere, e.g. success page or waiting page
        navigate(`/post-checkin/${sessionId}`);
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Произошла непредвиденная ошибка'));
      } finally {
        setLoading(false);
      }
    };

  const renderScaleButtons = (currentValue: number | null, setValue: (v: number) => void) => {
    return (
      <div className="flex justify-between gap-2 w-full max-w-sm mx-auto mt-8">
        {[1, 2, 3, 4, 5].map((val) => (
              <button
            key={val}
            onClick={() => {
              setValue(val);
              setTimeout(handleNext, 300);
            }}
            className={`ds-scale flex items-center justify-center
              ${currentValue === val
                ? 'ds-scale-active'
                : ''
              }`}
          >
            {val}
          </button>
                ))}
              </div>
  );
  };

  if (success) {
    return (
      <div className="ds-page min-h-screen flex flex-col justify-center items-center p-4 text-center">
        <div className="w-20 h-20 bg-flag-ok text-ink rounded-full flex items-center justify-center mb-6 text-4xl">✓</div>
        <h1 className="text-3xl text-chalk font-display mb-2">Отлично!</h1>
        <p className="text-chalk-dim">Хорошей тренировки. Возвращайтесь после нее.</p>
      </div>
    );
  }

  return (
    <div className="ds-page min-h-screen flex flex-col px-4 py-6 sm:p-8 max-w-lg mx-auto">
      {/* Progress Indicators */}
      <div className="flex justify-center space-x-2 mt-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full ${i === step ? 'w-8 bg-rope' : i < step ? 'w-2 bg-rope/50' : 'w-2 bg-panel'}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {error && (
          <div className="ds-error mb-6 p-4 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in text-center">
            <h2 className="text-3xl font-display text-chalk mb-4">Как ты спал?</h2>
            <p className="text-chalk-dim mb-8">1 - Отлично, 5 - Ужасно</p>
            {renderScaleButtons(sleep, setSleep)}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in text-center">
            <h2 className="text-3xl font-display text-chalk mb-4">Как себя чувствуешь?</h2>
            <p className="text-chalk-dim mb-8">1 - Свежий, 5 - Выбитый из сил</p>
            {renderScaleButtons(fatigue, setFatigue)}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in text-center">
            <h2 className="text-3xl font-display text-chalk mb-4">Уровень стресса?</h2>
            <p className="text-chalk-dim mb-8">1 - Спокоен, 5 - Сильный стресс</p>
            {renderScaleButtons(stress, setStress)}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in text-center">
            <h2 className="text-3xl font-display text-chalk mb-12">Есть ли боль?</h2>
            <div className="flex flex-col space-y-4 max-w-xs mx-auto">
              <button
                onClick={() => setPain(false)}
                className={`ds-ghost py-4 px-6 text-lg
                  ${pain === false ? 'border-tatami bg-tatami text-ink' : ''}`}
              >
                Нет боли
              </button>
              <button
                onClick={() => setPain(true)}
                className={`ds-ghost py-4 px-6 text-lg
                  ${pain === true ? 'border-tatami bg-tatami text-ink' : ''}`}
              >
                Да, есть боль
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-center pb-8">
        <button
          onClick={handlePrev}
          disabled={step === 1 || loading}
          className="ds-ghost px-5 text-chalk-dim disabled:opacity-0"
        >
          Назад
        </button>

        {step === 4 && (
          <button
            onClick={handleSubmit}
            disabled={pain === null || loading}
            className="ds-primary py-4 px-8"
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AthletePreCheckIn;
