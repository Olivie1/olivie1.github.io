/**
 * API слой приложения
 * Пока обёртка над мок-данными, но при добавлении реального backend
 * достаточно обновить эти функции, чтобы дергать сервер вместо mock.ts
 *
 * Компоненты используют ТОЛЬКО эти функции, не трогают mock.ts напрямую
 */

import {
  User,
  Club,
  CheckIn,
  Insight,
  CoachRecommendation,
  Reward,
} from '../types/index';
import { getMockDataStore } from '../data/mock';

// ============ Пользователи ============

/**
 * Получить пользователя по ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const store = getMockDataStore();
  return store.users.find((u) => u.id === userId) || null;
}

/**
 * Получить всех пользователей клуба
 */
export async function getClubMembers(clubId: string): Promise<User[]> {
  const store = getMockDataStore();
  return store.users.filter((u) => u.clubId === clubId);
}

/**
 * Получить всех спортсменов (с фильтром по клубу опционально)
 */
export async function getAthletes(clubId?: string): Promise<User[]> {
  const store = getMockDataStore();
  return store.users.filter((u) => u.role === 'athlete' && (!clubId || u.clubId === clubId));
}

/**
 * Получить всех тренеров (с фильтром по клубу опционально)
 */
export async function getCoaches(clubId?: string): Promise<User[]> {
  const store = getMockDataStore();
  return store.users.filter((u) => u.role === 'coach' && (!clubId || u.clubId === clubId));
}

// ============ Клубы ============

/**
 * Получить клуб по ID
 */
export async function getClubById(clubId: string): Promise<Club | null> {
  const store = getMockDataStore();
  return store.clubs.find((c) => c.id === clubId) || null;
}

/**
 * Получить все клубы
 */
export async function getAllClubs(): Promise<Club[]> {
  const store = getMockDataStore();
  return store.clubs;
}

// ============ Чек-ины ============

/**
 * Получить чек-ины спортсмена
 */
export async function getAthleteCheckIns(athleteId: string): Promise<CheckIn[]> {
  const store = getMockDataStore();
  return store.allCheckIns.filter((c) => c.athleteId === athleteId);
}

/**
 * Получить последний чек-ин спортсмена (если есть)
 */
export async function getLatestCheckIn(athleteId: string): Promise<CheckIn | null> {
  const checkIns = await getAthleteCheckIns(athleteId);
  return checkIns.length > 0 ? checkIns[0] : null;
}

/**
 * Получить чек-ины за конкретный день (для дашборда тренера)
 */
export async function getCheckInsForDate(date: string): Promise<CheckIn[]> {
  const store = getMockDataStore();
  return store.allCheckIns.filter((c) => c.date === date);
}

/**
 * Сохранить/обновить чек-ин спортсмена (stub для MVP1)
 * На этапе 2 будет POST/PUT на сервер
 */
export async function saveCheckIn(checkIn: CheckIn): Promise<CheckIn> {
  const store = getMockDataStore();

  // Проверяем, есть ли уже чек-ин на эту дату
  const existingIndex = store.allCheckIns.findIndex(
    (c) => c.athleteId === checkIn.athleteId && c.date === checkIn.date
  );

  if (existingIndex >= 0) {
    store.allCheckIns[existingIndex] = checkIn;
  } else {
    store.allCheckIns.push(checkIn);
  }

  return checkIn;
}

// ============ Инсайты ============

/**
 * Получить инсайты спортсмена
 */
export async function getAthleteInsights(athleteId: string): Promise<Insight[]> {
  const store = getMockDataStore();
  return store.allInsights.filter((i) => i.athleteId === athleteId);
}

/**
 * Получить последний инсайт спортсмена (если есть)
 */
export async function getLatestInsight(athleteId: string): Promise<Insight | null> {
  const insights = await getAthleteInsights(athleteId);
  return insights.length > 0 ? insights[0] : null;
}

// ============ Рекомендации тренера ============

/**
 * Получить рекомендации тренера для его клуба
 */
export async function getCoachRecommendations(clubId: string): Promise<CoachRecommendation[]> {
  const store = getMockDataStore();
  return store.allRecommendations.filter((r) => r.clubId === clubId);
}

// ============ Награды ============

/**
 * Получить все доступные награды
 */
export async function getAllRewards(): Promise<Reward[]> {
  const store = getMockDataStore();
  return store.rewards;
}

// ============ Аутентификация (stub) ============

/**
 * Простой "логин" для MVP1 (без реальной авторизации)
 * [уточнить] на этапе 2 это будет реальный JWT/session
 */
export async function loginUser(
  identifier: string,
  role: 'athlete' | 'coach'
): Promise<User | null> {
  const store = getMockDataStore();

  // Простой поиск: можно искать по ID или частичному имени
  let user = store.users.find((u) => u.id === identifier && u.role === role);

  if (!user) {
    user = store.users.find((u) => u.name.toLowerCase().includes(identifier.toLowerCase()) && u.role === role);
  }

  return user || null;
}

/**
 * Регистрация нового пользователя (stub)
 * [уточнить] полная механика регистрации на этапе 2
 */
export async function registerUser(
  name: string,
  _email: string,
  role: 'athlete' | 'coach',
  clubId: string
): Promise<User> {
  const store = getMockDataStore();

  const newUser: User = {
    id: `user-new-${Date.now()}`,
    name,
    role,
    clubId,
  };

  store.users.push(newUser);
  return newUser;
}

