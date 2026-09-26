/**
 * Тип роли пользователя
 */
export type Role = 'athlete' | 'coach' | 'partner';

/**
 * Уровень усталости (1-5 шкала)
 */
export type FatigueLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Уровень водного баланса
 * [уточнить] формат: категории или число мл?
 * Пока используем категории для простоты
 */
export type WaterIntake = 'low' | 'normal' | 'high';

/**
 * Пользователь приложения
 */
export interface User {
  id: string;
  name: string;
  role: Role;
  clubId: string;
}

/**
 * Клуб/команда
 */
export interface Club {
  id: string;
  name: string;
}

/**
 * Ежедневный чек-ин от спортсмена
 * Содержит данные о сне, гидратации, усталости и опциональные метрики
 */
export interface CheckIn {
  id: string;
  athleteId: string;
  date: string; // ISO date (YYYY-MM-DD)
  sleepHours: number;
  waterIntake: WaterIntake;
  fatigueLevel: FatigueLevel;
  gripStrength?: number; // опционально, по ротации (кг)
  pulse?: number; // опционально, по ротации (уд/мин)
}

/**
 * Инсайт/рекомендация для спортсмена
 * Генерируется на основе чек-инов, показывает отклонения от нормы
 */
export interface Insight {
  id: string;
  athleteId: string;
  date: string; // ISO date
  message: string; // напр. "Хват сегодня на 8% ниже вашего среднего"
  type?: 'warning' | 'info' | 'achievement'; // [уточнить] типология инсайтов
}

/**
 * Рекомендация от тренера для клуба
 * Агрегирует проблемы группы спортсменов
 */
export interface CoachRecommendation {
  id: string;
  clubId: string;
  date: string; // ISO date
  message: string; // напр. "У 4 спортсменов повышенная усталость"
  affectedAthleteCount?: number;
}

/**
 * Награда/челлендж от партнёра
 * На MVP1 — просто отображаем, механика реализуется на этапе 2
 */
export interface Reward {
  id: string;
  title: string;
  description: string;
  condition: string; // напр. "10 из 14 чек-инов"
  partnerName?: string;
  icon?: string; // URL картинки или emoji
}

/**
 * Сессия текущего пользователя
 * На MVP1 — упрощённая (без JWT/token), просто в памяти
 */
export interface Session {
  user: User;
  isLoggedIn: boolean;
}
