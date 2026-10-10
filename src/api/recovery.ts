/** Persist request credentials before sending, so a lost response is retryable. */
export interface PendingSessionCreation {
  request_id: string;
  athlete_count: number;
  extended_athlete_ids: string[];
  extended_participant_ids?: string[];
}

const pendingKey = (trainerId: string) => `coach-pending-session:${trainerId}`;

export function readPendingCreation(trainerId: string, storage: Storage = localStorage): PendingSessionCreation | null {
  const raw = storage.getItem(pendingKey(trainerId));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as PendingSessionCreation;
    if (typeof value.request_id !== 'string' || value.request_id.length < 16 || !Number.isInteger(value.athlete_count) || value.athlete_count <= 0 || !Array.isArray(value.extended_athlete_ids) || !value.extended_athlete_ids.every(code => typeof code === 'string')) throw new Error('Invalid saved creation');
    if (value.extended_participant_ids !== undefined && (!Array.isArray(value.extended_participant_ids) || !value.extended_participant_ids.every(id => typeof id === 'string'))) throw new Error('Invalid saved participants');
    return value;
  } catch {
    storage.removeItem(pendingKey(trainerId));
    return null;
  }
}

export function persistCreation(trainerId: string, request: PendingSessionCreation, storage: Storage = localStorage) {
  storage.setItem(pendingKey(trainerId), JSON.stringify(request));
}

export function clearPendingCreation(trainerId: string, storage: Storage = localStorage) {
  storage.removeItem(pendingKey(trainerId));
}

export async function registrationSecret(sessionId: string, code: string, storage: Storage = localStorage): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.trim().toUpperCase()));
  const suffix = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  const key = `registration-secret:${sessionId}:${suffix}`;
  const previous = storage.getItem(key);
  if (previous) return previous;
  const secret = crypto.randomUUID();
  storage.setItem(key, secret);
  return secret;
}
