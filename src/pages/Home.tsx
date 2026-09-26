import { useNavigate } from 'react-router-dom';
import { currentSession } from '../App';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="ds-page min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-4xl sm:text-5xl font-display text-chalk mb-4">Recovery App</h1>
          <p className="text-xl text-chalk-dim mb-8 max-w-2xl mx-auto">
            Современная платформа для отслеживания восстановления и здоровья спортсменов
          </p>

          {(() => {
            const session = currentSession;
            const coachToken = localStorage.getItem('coach_token');
            if (coachToken) {
              return (
                <button
                  onClick={() => navigate('/dashboard')}
              className="ds-primary inline-block px-8 py-4 text-lg"
            >
                  Перейти в дашборд
            </button>
              );
            }
            if (!session) {
              return (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/coach-login')}
                className="ds-primary inline-block px-8 py-4 text-lg"
              >
                    Вход для тренера
              </button>
                  <button
                    onClick={() => navigate('/register-athlete')}
                    className="ds-ghost inline-block px-8 py-4 text-lg"
                  >
                    Сканировать QR спортсмена
                  </button>
        </div>
  );
}
            return (
              <button
                onClick={() => {
                  if (session.user.role === 'athlete') {
                    navigate('/insights');
                  } else if (session.user.role === 'coach') {
                    navigate('/dashboard');
                  }
                }}
                className="ds-primary inline-block px-8 py-4 text-lg"
              >
                Перейти в приложение
              </button>
  );
          })()}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="ds-card p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-display text-chalk mb-3">Отслеживание метрик</h3>
            <p className="text-chalk-dim">
              Следите за сном, гидратацией, уровнем усталости и физическими показателями
            </p>
          </div>

          {/* Feature 2 */}
          <div className="ds-card p-6">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-display text-chalk mb-3">Персональные инсайты</h3>
            <p className="text-chalk-dim">
              Получайте рекомендации на основе анализа ваших данных восстановления
            </p>
          </div>

          {/* Feature 3 */}
          <div className="ds-card p-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-display text-chalk mb-3">Управление сессиями</h3>
            <p className="text-chalk-dim">
              Тренеры видят статус всей команды через QR-чек-ины и могут давать целевые рекомендации
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="ds-card p-8">
          <h2 className="text-2xl font-display text-chalk mb-6">Как это работает</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rope text-ink font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-chalk">Тренер создает сессию</h3>
                <p className="text-chalk-dim mt-1">
                  Тренер генерирует QR-код для тренировки
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rope text-ink font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-chalk">Спортсмены сканируют код</h3>
                <p className="text-chalk-dim mt-1">
                  Быстрый pre-check-in за 30 секунд с мобильного
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-rope text-ink font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-chalk">Итоги сессии</h3>
                <p className="text-chalk-dim mt-1">
                  Тренер видит агрегированную сводку и AI-заметку в реальном времени
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-ink border-t ds-divider text-chalk py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>Recovery App — QR Check-in Pilot</p>
          <p className="text-chalk-dim mt-2 text-sm">
          </p>
        </div>
      </div>
    </div>
  );
}
