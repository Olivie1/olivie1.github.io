import {
  User,
  Club,
  CheckIn,
  Insight,
  CoachRecommendation,
  Reward,
  Role,
  FatigueLevel,
  WaterIntake,
} from '../types/index';

/**
 * Генератор мок-данных для MVP1
 * Все данные создаются при загрузке и хранятся в памяти
 * На этапе 2 заменяется на реальные API вызовы
 */

// ============ Вспомогательные функции ============

function randomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============ Генерация основных сущностей ============

/**
 * Генерирует список клубов
 */
export function generateClubs(count: number = 3): Club[] {
  const clubNames = [
    'Спортивный клуб "Молния"',
    'ДЮСШ "Орёл"',
    'Клуб "Чемпион"',
    'Школа атлетики "Сила"',
    'Центр боевых искусств "Тайгер"',
  ];

  return clubNames.slice(0, count).map((name, idx) => ({
    id: `club-${idx + 1}`,
    name,
  }));
}

/**
 * Генерирует список пользователей (спортсменов и тренеров)
 */
export function generateUsers(count: number = 15): User[] {
  const firstNames = [
    'Алексей',
    'Борис',
    'Виктор',
    'Галина',
    'Дмитрий',
    'Екатерина',
    'Женя',
    'Зоя',
    'Иван',
    'Кристина',
  ];
  const lastNames = [
    'Иванов',
    'Петров',
    'Сидоров',
    'Смирнов',
    'Волков',
    'Соколов',
    'Лебедев',
    'Орлов',
    'Морозов',
    'Ковалёв',
  ];

  const users: User[] = [];
  const clubs = generateClubs();

  // Примерно 80% спортсменов, 20% тренеров
  for (let i = 0; i < count; i++) {
    const role: Role = i < count * 0.8 ? 'athlete' : 'coach';
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);

    users.push({
      id: `user-${i + 1}`,
      name: `${firstName} ${lastName}`,
      role,
      clubId: randomItem(clubs).id,
    });
  }

  return users;
}

/**
 * Генерирует чек-ины для спортсмена на последние N дней
 */
export function generateCheckIns(athleteId: string, daysBack: number = 14): CheckIn[] {
  const checkIns: CheckIn[] = [];
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Не все дни включены в опрос (например, спортсмен может пропустить день)
    if (Math.random() < 0.85) {
      const waterIntakes: WaterIntake[] = ['low', 'normal', 'high'];
      const hasGripStrength = Math.random() < 0.5;
      const hasPulse = Math.random() < 0.5;

      checkIns.push({
        id: `checkin-${athleteId}-${formatDate(date)}`,
        athleteId,
        date: formatDate(date),
        sleepHours: randomInt(5, 9),
        waterIntake: randomItem(waterIntakes),
        fatigueLevel: randomInt(1, 5) as FatigueLevel,
        gripStrength: hasGripStrength ? randomInt(40, 70) : undefined,
        pulse: hasPulse ? randomInt(60, 100) : undefined,
      });
    }
  }

  return checkIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Генерирует инсайты для спортсмена на основе его чек-инов
 */
export function generateInsights(athleteId: string, checkIns: CheckIn[]): Insight[] {
  const insights: Insight[] = [];

  if (checkIns.length < 3) {
    return insights;
  }

  // Анализируем последние 7 дней
  const recentCheckIns = checkIns.slice(0, 7);

  // Инсайт об усталости
  const avgFatigue =
    recentCheckIns.reduce((sum, c) => sum + c.fatigueLevel, 0) / recentCheckIns.length;
  if (avgFatigue > 3.5) {
    insights.push({
      id: randomId(),
      athleteId,
      date: formatDate(new Date()),
      message: `⚠️ Повышенная усталость: среднее значение ${avgFatigue.toFixed(1)} из 5`,
      type: 'warning',
    });
  }

  // Инсайт о сне
  const avgSleep =
    recentCheckIns.reduce((sum, c) => sum + c.sleepHours, 0) / recentCheckIns.length;
  if (avgSleep < 7) {
    insights.push({
      id: randomId(),
      athleteId,
      date: formatDate(new Date()),
      message: `💤 Недостаточно сна: среднее ${avgSleep.toFixed(1)} часов в день`,
      type: 'info',
    });
  }

  // Инсайт о воде
  const lowWaterDays = recentCheckIns.filter((c) => c.waterIntake === 'low').length;
  if (lowWaterDays >= 3) {
    insights.push({
      id: randomId(),
      athleteId,
      date: formatDate(new Date()),
      message: `💧 Низкий уровень гидратации: ${lowWaterDays} дней из последних 7`,
      type: 'warning',
    });
  }

  // Рандомный achievement
  if (recentCheckIns.length === 7 && Math.random() < 0.3) {
    insights.push({
      id: randomId(),
      athleteId,
      date: formatDate(new Date()),
      message: '🏆 7 дней подряд заполняешь опрос! Продолжай в том же темпе!',
      type: 'achievement',
    });
  }

  return insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Генерирует рекомендации тренера для клуба на основе данных спортсменов
 */
export function generateCoachRecommendations(
  clubId: string,
  athletes: User[],
  allCheckIns: CheckIn[]
): CoachRecommendation[] {
  const recommendations: CoachRecommendation[] = [];
  const clubAthletes = athletes.filter((a) => a.clubId === clubId && a.role === 'athlete');

  if (clubAthletes.length === 0) {
    return recommendations;
  }

  // Анализируем чек-ины атлетов клуба за последний день
  const today = formatDate(new Date());
  const todaysCheckIns = allCheckIns.filter(
    (c) => c.date === today && clubAthletes.some((a) => a.id === c.athleteId)
  );

  if (todaysCheckIns.length === 0) {
    return recommendations;
  }

  // Рекомендация об усталости
  const tiredAthletes = todaysCheckIns.filter((c) => c.fatigueLevel >= 4);
  if (tiredAthletes.length >= 2) {
    recommendations.push({
      id: randomId(),
      clubId,
      date: today,
      message: `⚠️ У ${tiredAthletes.length} спортсменов повышенная усталость. Рекомендуется снизить нагрузку.`,
      affectedAthleteCount: tiredAthletes.length,
    });
  }

  // Рекомендация о низкой гидратации
  const dehydratedAthletes = todaysCheckIns.filter((c) => c.waterIntake === 'low');
  if (dehydratedAthletes.length >= 2) {
    recommendations.push({
      id: randomId(),
      clubId,
      date: today,
      message: `💧 ${dehydratedAthletes.length} спортсменов имеют низкий уровень гидратации.`,
      affectedAthleteCount: dehydratedAthletes.length,
    });
  }

  // Рекомендация о недостатке сна
  const sleepyAthletes = todaysCheckIns.filter((c) => c.sleepHours < 7);
  if (sleepyAthletes.length >= 2) {
    recommendations.push({
      id: randomId(),
      clubId,
      date: today,
      message: `💤 ${sleepyAthletes.length} спортсменов спали менее 7 часов.`,
      affectedAthleteCount: sleepyAthletes.length,
    });
  }

  return recommendations;
}

/**
 * Генерирует награды/челленджи
 */
export function generateRewards(): Reward[] {
  return [
    {
      id: 'reward-1',
      title: 'Первый шаг',
      description: 'Заполни 3 опроса подряд',
      condition: '3/3 чек-инов',
      partnerName: 'RecoveryApp',
      icon: '🎯',
    },
    {
      id: 'reward-2',
      title: 'Гидратор',
      description: 'Поддерживай высокий уровень воды 7 дней',
      condition: '7 дней high/normal',
      partnerName: 'H2O Partners',
      icon: '💧',
    },
    {
      id: 'reward-3',
      title: 'Спящий чемпион',
      description: 'Спи не менее 8 часов 10 дней',
      condition: '10 ночей 8+ часов',
      partnerName: 'Sleep Tech',
      icon: '😴',
    },
    {
      id: 'reward-4',
      title: 'Стальной хват',
      description: 'Достигни среднего хвата 65+ кг',
      condition: 'avg grip 65 кг',
      partnerName: 'Grip Strength Pro',
      icon: '💪',
    },
    {
      id: 'reward-5',
      title: 'Марафонец',
      description: 'Заполни все опросы месяца',
      condition: '30/30 чек-инов',
      partnerName: 'RecoveryApp',
      icon: '🏅',
    },
  ];
}

// ============ Инициализация глобального хранилища ============

/**
 * Глобальное хранилище мок-данных
 * Инициализируется один раз при загрузке приложения
 */
export interface MockDataStore {
  clubs: Club[];
  users: User[];
  allCheckIns: CheckIn[];
  allInsights: Insight[];
  allRecommendations: CoachRecommendation[];
  rewards: Reward[];
}

let mockDataStore: MockDataStore | null = null;

/**
 * Инициализирует и возвращает хранилище мок-данных
 */
export function initializeMockData(): MockDataStore {
  if (mockDataStore) {
    return mockDataStore;
  }

  const clubs = generateClubs();
  const users = generateUsers(15);

  // Генерируем чек-ины для всех спортсменов
  const allCheckIns: CheckIn[] = [];
  users
    .filter((u) => u.role === 'athlete')
    .forEach((athlete) => {
      allCheckIns.push(...generateCheckIns(athlete.id));
    });

  // Генерируем инсайты для всех спортсменов
  const allInsights: Insight[] = [];
  users
    .filter((u) => u.role === 'athlete')
    .forEach((athlete) => {
      const athleteCheckIns = allCheckIns.filter((c) => c.athleteId === athlete.id);
      allInsights.push(...generateInsights(athlete.id, athleteCheckIns));
    });

  // Генерируем рекомендации для всех тренеров (по их клубам)
  const allRecommendations: CoachRecommendation[] = [];
  clubs.forEach((club) => {
    const recommendations = generateCoachRecommendations(club.id, users, allCheckIns);
    allRecommendations.push(...recommendations);
  });

  // Генерируем награды
  const rewards = generateRewards();

  mockDataStore = {
    clubs,
    users,
    allCheckIns,
    allInsights,
    allRecommendations,
    rewards,
  };

  return mockDataStore;
}

/**
 * Получает инициализированное хранилище
 */
export function getMockDataStore(): MockDataStore {
  if (!mockDataStore) {
    return initializeMockData();
  }
  return mockDataStore;
}
