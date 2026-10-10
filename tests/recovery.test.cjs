const test = require('node:test');
let completed = 0;
test.afterEach(() => { require('node:fs').writeFileSync(process.env.RECOVERY_TEST_MARKER, String(++completed)); });
const assert = require('node:assert/strict');
globalThis.crypto = require('node:crypto').webcrypto;
const { registrationSecret, readPendingCreation, persistCreation, clearPendingCreation } = require(process.env.RECOVERY_TEST_MODULE);
class Storage {
  constructor(entries) { this.values = new Map(entries); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test('lost registration response and browser reload keep the same recovery credential', async () => {
  const original = new Storage();
  const first = await registrationSecret('session-one', ' Test-Code ', original);
  // Reload creates a new helper invocation from the same persisted browser data.
  const reloaded = new Storage(original.values);
  const retry = await registrationSecret('session-one', 'TEST-CODE', reloaded);
  assert.equal(retry, first);
  assert.ok(first.length >= 32);
  assert.ok([...original.values.keys()].every(key => !key.includes('TEST-CODE')));
  assert.notEqual(await registrationSecret('session-two', 'TEST-CODE', reloaded), first);
  assert.notEqual(await registrationSecret('session-one', 'ANOTHER-CODE', reloaded), first);
});

test('two simultaneous registration attempts share one persisted proof', async () => {
  const storage = new Storage();
  const values = await Promise.all([registrationSecret('session', 'CODE', storage), registrationSecret('session', 'CODE', storage)]);
  assert.equal(values[0], values[1]);
});

test('registration refuses to proceed if the proof cannot be persisted', async () => {
  const storage = new Storage();
  storage.setItem = () => { throw new Error('Storage unavailable'); };
  await assert.rejects(registrationSecret('session', 'CODE', storage), /Storage unavailable/);
});

test('an unconfirmed creation survives reload with its original request and participant list', () => {
  const storage = new Storage();
  const request = { request_id: crypto.randomUUID(), athlete_count: 3, extended_athlete_ids: ['LOCAL-A', 'LOCAL-B'] };
  persistCreation('trainer-one', request, storage);
  const reloaded = new Storage(storage.values);
  assert.deepEqual(readPendingCreation('trainer-one', reloaded), request);
  assert.equal(readPendingCreation('trainer-two', reloaded), null);
  clearPendingCreation('trainer-one', reloaded);
  assert.equal(readPendingCreation('trainer-one', reloaded), null);
});

test('invalid persisted draft is removed rather than replayed', () => {
  const storage = new Storage([['coach-pending-session:trainer-one', '{invalid']]);
  assert.equal(readPendingCreation('trainer-one', storage), null);
  assert.equal(storage.values.size, 0);
});
