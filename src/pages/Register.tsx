import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Role } from '../types/index';
import { getAthletes } from '../api/index';

interface RegisterProps {
  onLogin: (user: User) => void;
}

export default function Register({ onLogin }: RegisterProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'select'>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = async (role: Role) => {
    setLoading(true);
    setError('');
    setSelectedRole(role);

    try {
      if (role === 'athlete' || role === 'coach') {
        const users = await (role === 'athlete'
          ? getAthletes()
          : getAthletes()); // пока все спортсмены, тренеры отдельно на этап 2
        setAthletes(users);
        setStep('select');
      }
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onLogin(user);
    navigate(user.role === 'athlete' ? '/check-in' : '/dashboard');
  };

  if (step === 'role') {
    return (
      <div className="ds-page min-h-screen flex items-center justify-center px-4 py-8">
        <div className="ds-card ds-mobile-card max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⚡</div>
            <h1 className="text-3xl font-display text-chalk mb-2">Recovery App</h1>
            <p className="text-chalk-dim">Платформа для восстановления спортсменов</p>
          </div>

          <p className="text-center text-chalk mb-6 font-semibold">Выберите вашу роль:</p>

          <div className="space-y-3">
            <button
              onClick={() => handleRoleSelect('athlete')}
              disabled={loading}
              className="ds-primary w-full py-4 px-4"
            >
              {loading ? 'Загрузка...' : '🏃 Спортсмен (mock)'}
            </button>

            <button
              onClick={() => handleRoleSelect('coach')}
              disabled={loading}
              className="ds-ghost w-full py-4 px-4"
            >
              {loading ? 'Загрузка...' : '👨‍🏫 Тренер'}
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="ds-ghost w-full mt-6 py-2 px-4 text-chalk-dim"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-page min-h-screen flex items-center justify-center px-4 py-8">
      <div className="ds-card ds-mobile-card max-w-2xl w-full p-8">
        <h1 className="text-2xl font-display text-chalk mb-6">
          Выберите аккаунт ({selectedRole === 'athlete' ? 'Спортсмены' : 'Тренеры'})
        </h1>

        {error && <div className="ds-error mb-4 p-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
          {athletes.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="ds-ghost p-4 text-left"
            >
              <div className="font-semibold text-chalk">{user.name}</div>
              <div className="text-sm text-chalk-dim">{user.role === 'athlete' ? '🏃' : '👨‍🏫'}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setStep('role');
            setSelectedRole(null);
            setAthletes([]);
          }}
          className="ds-ghost w-full py-3 px-4 text-chalk-dim mt-4"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
