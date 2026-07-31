const STORAGE_KEY = 'trades-device-id';

// A random id generated once per browser and persisted, so the backend can
// recognize "this same browser logged in before" across sessions — used for
// the active-devices list and (later) the new-device login confirmation.
// Not a fingerprint: clearing site data resets it, which is an acceptable
// trade-off (the user just gets treated as a new device once).
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
