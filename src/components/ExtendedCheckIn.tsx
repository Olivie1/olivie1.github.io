import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/baseUrl';
import { getErrorMessage } from '../api/errors';

export default function ExtendedCheckIn({ sessionId, phase, onDone }: { sessionId: string; phase: 'pre' | 'post'; onDone: () => void }) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [declined, setDeclined] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirtyFields, setDirtyFields] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accessAttempt, setAccessAttempt] = useState(0);
  const credential = localStorage.getItem(`device_token:${sessionId}`) || localStorage.getItem('device_token') || '';
  useEffect(() => {
    const controller = new AbortController();
    setSelected(null); setDeclined(false); setError(''); setValues({}); setDirtyFields([]);
    fetch(`${API_BASE_URL}/api/checkin/extended/${sessionId}`, { headers: { 'X-Device-Token': credential }, signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || d.detail || 'Не удалось проверить доступ'); if (!controller.signal.aborted) { setSelected(d.data.selected); setDeclined(d.data.declined); setValues(Object.fromEntries(Object.entries(d.data[phase] || {}).filter(([, value]) => value !== null).map(([key, value]) => [key, String(value)]))); } })
      .catch(e => { if (!controller.signal.aborted) setError(getErrorMessage(e, 'Не удалось проверить доступ')); });
    return () => controller.abort();
  }, [sessionId, credential, phase, accessAttempt]);
  useEffect(() => { if (selected === false || declined) onDone(); }, [selected, declined, onDone]);
  const save = async (skip = false) => {
    setBusy(true); setError('');
    try {
      const payload: Record<string, unknown> = { session_id: sessionId, device_token: credential, phase: skip ? 'decline' : phase };
      if (!skip) for (const k of dirtyFields) {
        const v = values[k] || '';
        if (v !== '' && (k === 'grip' || k === 'pulse')) {
          const number = Number(v);
          if (!Number.isFinite(number) || number < 0 || (k === 'pulse' && (!Number.isInteger(number) || number === 0))) {
            throw new Error(k === 'pulse' ? 'Пульс: введите положительное целое число, уд/мин' : 'Хват: введите конечное неотрицательное число, кг');
          }
        }
        payload[k] = v === '' ? null : k === 'grip' || k === 'pulse' ? Number(v) : v === 'true' ? true : v === 'false' ? false : v;
      }
      const r = await fetch(`${API_BASE_URL}/api/checkin/extended`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || d.detail || 'Не удалось сохранить ответы'); onDone();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };
  const changeField = (key: string, value: string) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setDirtyFields(previous => previous.includes(key) ? previous : [...previous, key]);
  };
  const field = (key: string, label: string, options?: [string, string][]) => <label className="block my-4" key={key}>{label}
    {options ? <select className="ds-input p-3" disabled={busy} value={values[key] || ''} onChange={e => changeField(key, e.target.value)}><option value="">Без ответа</option>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select> : <input className="ds-input p-3" disabled={busy} type="number" min={key === 'grip' ? 0 : 1} step={key === 'grip' ? '0.1' : '1'} value={values[key] || ''} onChange={e => changeField(key, e.target.value)} />}
  </label>;
  const yesNo: [string, string][] = [['true', 'Да'], ['false', 'Нет']];
  return <div className="ds-card p-6 my-6"><h2 className="text-xl">Расширенный чек-ин — {phase === 'pre' ? 'до' : 'после'} тренировки</h2>
    {error && <p role="alert">{error}</p>}
    {selected === null ? error ? <button className="ds-ghost p-3" onClick={() => setAccessAttempt(v => v + 1)}>Повторить проверку доступа</button> : <p>Проверка доступа…</p> : selected && !declined && <>
      <p>Добровольно. Вопросы можно оставить без ответа.</p>
      {field('grip', 'Хват, кг (десятичное число)')}{field('pulse', 'Пульс, уд/мин (целое число)')}
      {phase === 'pre' ? <>{field('last_drink', 'Когда последний раз пил(а)?', [['lt30', 'Меньше получаса'], ['30to120', 'От получаса до 2 часов'], ['2to4', '2–4 часа'], ['gt4', 'Больше 4 часов']])}{field('ate', 'Ел(а) ли за последние 2 часа?', yesNo)}{field('caffeine', 'Кофеин за последние 4 часа?', yesNo)}</> : field('caffeine_during', 'Употреблял(а) кофеин во время тренировки?', yesNo)}
      <button className="ds-primary p-3" disabled={busy} onClick={() => save()}>Сохранить</button>
      {phase === 'pre' && <button className="ds-ghost p-3" disabled={busy} onClick={() => save(true)}>Не сегодня</button>}
    </>}
    {selected === null && error && <button className="ds-ghost p-3" onClick={onDone}>Продолжить без расширенного чек-ина</button>}
  </div>;
}
