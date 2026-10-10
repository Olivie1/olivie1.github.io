import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/baseUrl';

export default function ExtendedCheckIn({ sessionId, phase, onDone }: { sessionId: string; phase: 'pre' | 'post'; onDone: () => void }) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [declined, setDeclined] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const credential = localStorage.getItem(`device_token:${sessionId}`) || localStorage.getItem('device_token') || '';
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/checkin/extended/${sessionId}`, { headers: { 'X-Device-Token': credential } })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setSelected(d.data.selected); setDeclined(d.data.declined); })
      .catch(e => setError(String(e)));
  }, [sessionId, credential]);
  useEffect(() => { if (selected === false || declined) onDone(); }, [selected, declined, onDone]);
  const save = async (skip = false) => {
    setBusy(true); setError('');
    try {
      const payload: Record<string, unknown> = { session_id: sessionId, device_token: credential, phase: skip ? 'decline' : phase };
      if (!skip) for (const [k, v] of Object.entries(values)) if (v !== '') payload[k] = k === 'grip' || k === 'pulse' ? Number(v) : v === 'true' ? true : v === 'false' ? false : v;
      const r = await fetch(`${API_BASE_URL}/api/checkin/extended`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error); onDone();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };
  const field = (key: string, label: string, options?: [string, string][]) => <label className="block my-4" key={key}>{label}
    {options ? <select className="ds-input p-3" value={values[key] || ''} onChange={e => setValues({ ...values, [key]: e.target.value })}><option value="">Без ответа</option>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select> : <input className="ds-input p-3" type="number" min={key === 'grip' ? 0 : 1} step={key === 'grip' ? '0.1' : '1'} value={values[key] || ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />}
  </label>;
  const yesNo: [string, string][] = [['true', 'Да'], ['false', 'Нет']];
  return <div className="ds-card p-6 my-6"><h2 className="text-xl">Расширенный чек-ин — {phase === 'pre' ? 'до' : 'после'} тренировки</h2>
    {error && <p role="alert">{error}</p>}
    {selected === null ? <p>Проверка доступа…</p> : selected && !declined && <>
      <p>Добровольно. Вопросы можно оставить без ответа.</p>
      {field('grip', 'Хват, кг (десятичное число)')}{field('pulse', 'Пульс, уд/мин (целое число)')}
      {phase === 'pre' ? <>{field('last_drink', 'Когда последний раз пил(а)?', [['lt30', 'Меньше получаса'], ['30to120', 'От получаса до 2 часов'], ['2to4', '2–4 часа'], ['gt4', 'Больше 4 часов']])}{field('ate', 'Ел(а) ли за последние 2 часа?', yesNo)}{field('caffeine', 'Кофеин за последние 4 часа?', yesNo)}</> : field('caffeine_during', 'Употреблял(а) кофеин во время тренировки?', yesNo)}
      <button className="ds-primary p-3" disabled={busy} onClick={() => save()}>Сохранить</button>
      {phase === 'pre' && <button className="ds-ghost p-3" disabled={busy} onClick={() => save(true)}>Не сегодня</button>}
    </>}
  </div>;
}
