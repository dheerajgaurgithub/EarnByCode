// Simple in-memory metrics service. For production, send to a metrics backend.
const counters = new Map();

export function increment(name, value = 1) {
  const key = String(name);
  counters.set(key, (counters.get(key) || 0) + value);
}

export function gauge(name, value) {
  const key = String(name);
  counters.set(key, Number(value) || 0);
}

// Timers
export function beginTimer(name) {
  const key = String(name);
  const start = Date.now();
  return function end(extraLabels = {}) {
    const ms = Date.now() - start;
    increment(`${key}_count`, 1);
    increment(`${key}_sum_ms`, ms);
    observe(`${key}_hist`, ms);
    if (ms > 2000) increment(`${key}_slow_count`, 1);
    return ms;
  };
}

// Histogram observe with preset buckets
const DEFAULT_BUCKETS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 30000];
export function observe(name, value, buckets = DEFAULT_BUCKETS) {
  const v = Math.max(0, Number(value) || 0);
  let placed = false;
  for (const b of buckets) {
    if (v <= b) {
      increment(`${name}_le_${b}`);
      placed = true;
      break;
    }
  }
  if (!placed) increment(`${name}_le_inf`);
}

export function snapshot() {
  const obj = {};
  for (const [k, v] of counters.entries()) obj[k] = v;
  return obj;
}

export default { increment, gauge, beginTimer, observe, snapshot };
