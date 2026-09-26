import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';

interface CoachLoginProps {
  onLoginSuccess: (token: string) => void;
}

export const CoachLogin: React.FC<CoachLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError('Пожалуйста, введите код доступа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secret.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код доступа');
      }

      // Сохраняем токен
      localStorage.setItem('coach_token', data.data.token);
      localStorage.setItem('coach_token_expires', data.data.expires_at);

      onLoginSuccess(data.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Произошла непредвиденная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page min-h-screen flex flex-col justify-center items-center px-4 py-8">
      <div className="ds-card ds-mobile-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">⚡</div>
          <h1 className="text-3xl font-display text-chalk mb-2">Recovery App</h1>
          <p className="text-chalk-dim">Вход для тренеров</p>
        </div>

        {error && (
          <div className="ds-error mb-6 p-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secret" className="block text-chalk-dim mb-2 text-sm uppercase tracking-wider">
              Код доступа тренера
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Введите код"
              className="ds-input text-lg p-4 focus:border-rope focus:outline-none"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="ds-primary w-full text-lg py-4 px-6"
          >
            {loading ? 'Загрузка...' : 'Вход'}
          </button>
        </form>

        <div className="mt-6 p-4 border-t ds-divider">
          <p className="text-xs text-chalk-dim text-center">
            Для демонстрации используйте код:
            <br />
            <code className="text-rope font-bold">default-trainer-secret-12345</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachLogin;
