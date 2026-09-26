import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const CheckInSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Опционально: очищаем токен, если хотим, чтобы на следующей сессии
    // спортсмен заново вводил код.
    // localStorage.removeItem('device_token');
    
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="ds-page min-h-screen flex flex-col justify-center items-center p-4 text-center">
      <div className="w-24 h-24 bg-flag-ok text-ink rounded-full flex items-center justify-center mb-6 text-5xl">
        ✓
      </div>
      <h1 className="text-4xl text-chalk font-display mb-4">Спасибо!</h1>
      <p className="text-chalk-dim text-lg max-w-md mx-auto">
        Ваши данные успешно записаны. Можете закрыть эту страницу. 
      </p>
    </div>
  );
};

export default CheckInSuccess;
