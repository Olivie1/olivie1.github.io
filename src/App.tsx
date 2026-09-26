import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User, Session } from './types/index';
import { initializeMockData } from './data/mock';

// Страницы
import Register from './pages/Register';
import Home from './pages/Home';
import CoachLogin from './pages/CoachLogin';
import CoachDashboard from './pages/CoachDashboard';
import AthleteInsights from './pages/AthleteInsights';
import AthleteRegistration from './pages/AthleteRegistration';
import AthletePreCheckIn from './pages/AthletePreCheckIn';
import AthletePostCheckIn from './pages/AthletePostCheckIn';
import CheckInSuccess from './pages/CheckInSuccess';

export let currentSession: Session | null = null;

export function setSession(session: Session | null) {
  currentSession = session;
}

function App() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [coachToken, setCoachToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMockData();

    const savedToken = localStorage.getItem('coach_token');
    if (savedToken) {
      setCoachToken(savedToken);
    }

    const savedSession = localStorage.getItem('recovery_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSessionState(parsed);
        currentSession = parsed;
      } catch {
        // Некорректные данные, игнорируем
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    const newSession: Session = {
      user,
      isLoggedIn: true,
    };
    setSessionState(newSession);
    currentSession = newSession;
    localStorage.setItem('recovery_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSessionState(null);
    currentSession = null;
    localStorage.removeItem('recovery_session');
  };

  const handleCoachLogout = () => {
    setCoachToken(null);
    localStorage.removeItem('coach_token');
    localStorage.removeItem('coach_token_expires');
  };

  const handleCoachLoginSuccess = (token: string) => {
    setCoachToken(token);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink">
        <div className="text-center">
          <div className="text-2xl font-bold text-rope mb-2">Recovery App</div>
          <div className="text-chalk-dim">Загрузка...</div>
        </div>
      </div>
    );
  }

  const ProtectedPreCheckIn = () => {
    const token = localStorage.getItem('device_token');
    if (!token) {
      return <Navigate to="/register-athlete" replace />;
    }
    return <AthletePreCheckIn />;
  };

  const ProtectedPostCheckIn = () => {
    const token = localStorage.getItem('device_token');
    if (!token) {
      return <Navigate to="/register-athlete" replace />;
    }
    return <AthletePostCheckIn />;
  };

  const ProtectedCoachDashboard = () => {
    if (!coachToken) {
      return <Navigate to="/coach-login" replace />;
    }
    return <CoachDashboard token={coachToken} onLogout={handleCoachLogout} />;
  };

  return (
    <BrowserRouter>
      <div className="ds-page min-h-screen font-sans">
        <nav className="bg-panel border-b ds-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-rope">⚡</div>
                <div className="text-lg font-display text-chalk">Recovery App</div>
              </div>

              {coachToken ? (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-chalk">
                    <div className="font-medium">Тренер</div>
                    <div className="text-xs text-chalk-dim">Авторизован</div>
                  </div>
                  <button
                    onClick={handleCoachLogout}
                    className="ds-ghost min-h-0 px-3 py-2 text-sm text-chalk-dim"
                  >
                    Выход
                  </button>
                </div>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-chalk">
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-xs text-chalk-dim capitalize">{session.user.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ds-ghost min-h-0 px-3 py-2 text-sm text-chalk-dim"
                  >
                    Выход
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/register-athlete" element={<AthleteRegistration />} />
          <Route path="/pre-checkin/:sessionId" element={<ProtectedPreCheckIn />} />
          <Route path="/post-checkin/:sessionId" element={<ProtectedPostCheckIn />} />
          <Route path="/success" element={<CheckInSuccess />} />

          <Route path="/coach-login" element={<CoachLogin onLoginSuccess={handleCoachLoginSuccess} />} />
          <Route path="/dashboard" element={<ProtectedCoachDashboard />} />

          {!session && !coachToken ? (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {session?.user.role === 'athlete' && (
                <>
                  <Route path="/home" element={<Home />} />
                  <Route path="/insights" element={<AthleteInsights onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/insights" replace />} />
                </>
              )}

              {session?.user.role === 'coach' && (
                <>
                  <Route path="/dashboard-old" element={<CoachDashboard onLogout={handleLogout} />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="*" element={<Navigate to="/dashboard-old" replace />} />
                </>
              )}

              {session?.user.role === 'partner' && (
                <>
                  <Route path="/home" element={<Home />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </>
              )}
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
